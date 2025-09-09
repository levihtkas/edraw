import express from "express";
import {z} from "zod";
import bcrypt from "bcrypt"
import cors from "cors";
import prisma from "@repo/db/prisma";
import {JWT_SECRET} from "@repo/common-backend/backend";
import jwt from "jsonwebtoken";
import { auth } from "./middleware/auth.js";

const app = express();


const userSiginObj = z.object({
  username: z.string(),
  password: z.string()
})
app.use(express.json())
app.use(cors())

app.post("/signup",async (req,res)=>{
  try{
    const parsed = userSiginObj.safeParse(req.body);
    console.log("Hit")
  if(!parsed.success){
    res.status(400).json({message:parsed.error})
  }
  const username = parsed.data!.username;
  const password = parsed.data!.password;

  const hashedPassword = await bcrypt.hash(password,10);
  

  const user =await prisma.user.create({
    data:{
      username:username,
      password:hashedPassword
    },
    select:{id:true}
  })

  const token = jwt.sign({id:user.id},JWT_SECRET as unknown as string)

  res.status(200).json({"token":token})



  } catch (err) {
    console.log(err)
    res.status(400).json({message:"token not created"})
  }


})

app.post("/signin",async (req,res)=>{
  try{
    const parsed = userSiginObj.safeParse(req.body);
  if(!parsed.success){
    res.status(400).json({message:parsed.error})
  }
  const username = parsed.data!.username;
  const password = parsed.data!.password;


  const user = await prisma.user.findFirst({
    where:{username:username}
  })
  if(!user){
    res.status(400).json({message:"Bad request"})
    return
  }

  const ispassword = await bcrypt.compare(password,user?.password)
  console.log(user?.id)
  const token = jwt.sign({id:user!.id},JWT_SECRET as unknown as string)

  if(ispassword){
    res.status(200).json({token})
  } else{
    res.status(403).json({message:"Wrong password"})
  }
  } catch (err){
    console.log(err)
  }
})

app.post("/create-room",auth,async(req,res)=>{
  try{
    const {roomName} = req.body
    //@ts-ignore
    console.log(req.userId.id)
    const roomId = await prisma.room.create({
      data:{
        roomName : roomName,
        //@ts-ignore
        user_id: req.userId.id

      },select:{id:true}
    })
    res.status(200).json({message:`${roomId.id}`})
  } catch (e){
    console.log(e)
  }
  
})

app.post("/chats/:roomId",auth,async(req,res)=>{
   try{
    const roomId = req.params["roomId"]
    
    if(!roomId) return
    const data = await prisma.chats.findFirst({
      where:{roomId:Number(roomId) }
    })

    res.status(200).json({message:data})
   } catch (e){
    res.status(400).json({message:"Bad request found"})
   }
})

app.get("/chats/:roomId",async(req,res)=>{
  try{
   const roomId = req.params["roomId"]
   
   if(!roomId) return
   const data = await prisma.chats.findMany({
     where:{roomId:Number(roomId) }
   })

   console.log(`data ${data}`)

   res.status(200).json({message:data})
  } catch (e){
   res.status(400).json({message:"Bad request found"})
  }
})

app.post("/room/:roomName",auth,async(req,res)=>{
  try{
   const roomName = req.params["roomName"]
   //@ts-ignore
  //  console.log(req.userId)
   if(!roomName) return
   const data = await prisma.room.findFirst({
     where:{roomName:roomName },
     select:{id:true}
   })

   res.status(200).json({message:data?.id})
  } catch (e){
   res.status(400).json({message:"Bad request found"})
  }
})

app.listen(3000,()=>{
  console.log("listening in 3k port")
})