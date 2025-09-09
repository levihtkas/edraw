// import JWT_SECRET from "@repo/common-backend/backend";
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
const JWT_SECRET = "123"

export function auth(req:Request,res:Response,next:NextFunction){
  const authHeader = req.headers["authorization"];

  if(!authHeader){
    res.status(404).json({message:"not passed the token"})
    return
  }
  const token = authHeader!.split(" ")[1]
  try{
    if(!token) return;
    const userId = jwt.verify(token, JWT_SECRET) as JwtPayload
  if(userId){
    //@ts-ignore
    req.userId = userId;
    next()
  }
  else{
    res.status(403).json({message:"Invalid  token"})
  }
  } catch (e){
    console.log(e)
    res.status(403).json({message:"Invalid  token"})
  }
  


}