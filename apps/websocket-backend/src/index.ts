import { WebSocketServer } from "ws";
// import { JWT_SECRET } from "@repo/common-backend/backend";

import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "@repo/db/prisma"
import WebSocket from "ws";
// const ws_url = "ws://localhost:8080"
const wss = new WebSocketServer({ port: 8080 });

interface userRoom {
  user: string
  roomId: number
  socket: WebSocket
}
const JWT_SECRET = "123"

const userRoom: userRoom[] = []


wss.on("connection", (ws, req) => {

  const url = new URL(req.url!, `http://${req.headers.host}`)
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(4001, "No token provided")
    return
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.id) {
      ws.close(4002, "Invalid token payload");
      return;
    }
    //@ts-ignore
    console.log(decoded.id);
    //@ts-ignore
    ws.user = decoded.id
  } catch (err) {
    console.log(err)
    ws.close(4002, "Invalid token");
  }

  ws.on("message", async (message) => {
    const parsedM = JSON.parse(message.toString());
    parsedM.roomId = Number(parsedM.roomId)
    if (parsedM.type === "join_room") {
      if (!parsedM.roomId || typeof parsedM.roomId !== "number") {
        ws.send(JSON.stringify("Invalid roomId"))
        return
      }
      //@ts-ignore 
      const userId = ws.user;

      const alreadyJoined = userRoom.find((p) =>  p.roomId === parsedM.roomId && p.user===parsedM.userId)
      if (alreadyJoined) {
        ws.send(JSON.stringify("User is already part of the room"))
        
      } else{
        userRoom.push({ user: userId, roomId: parsedM.roomId, socket: ws })
        console.log(userRoom)
      }
      

      const chats = await prisma.chats.findMany({ where: { roomId: parsedM.roomId },include:{
        users: {select:{username:true}}
      }, orderBy: { id: "asc" } })
      ws.send(
        JSON.stringify({
          type: "chat_history",
          chats:chats
        }))
    }

    if (parsedM.type === "chat") {
      if (!parsedM.message) {
        ws.send("Send an valid message")
        return
      } else if (!parsedM.roomId) {
        ws.send("Send an valid roomId")
        return
      }

      const usersToSend = userRoom.find(x => x.roomId === parsedM.roomId);
      // const alreadyJoined = userRoom.find((p) =>  p.roomId === parsedM.roomId )

      if (!usersToSend) {
        return
      }
      try {
        const chat = await prisma.chats.create({
          data: {
            chats: parsedM.message,
            roomId: parsedM.roomId,
            //@ts-ignore
            user_id: ws.user
          }, include :{
            users:true
          }

        })
        userRoom.map((x) => {
          if (x.roomId === parsedM.roomId) {
            x.socket.send(JSON.stringify({
              "type": "chat",
              "message": chat.chats,
              "userId": chat.user_id,
              "roomId": chat.roomId,
              user: { username: chat.users.username }

            }))
          }
        })
      } catch (e) {
        console.log(e)
        return
      }



    }


  })



  // ws.send(`connected successfully ${token}`)
})