"use client";
import Image from "next/image";

import { useEffect, useReducer, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import jwt from "jsonwebtoken";
import { initDrawn } from "../../../../draw/initDraw";
import Circle from "../../../public/circle_12634888.png"
import { CanvasM } from "@/app/CanvasM/page";
import { Game } from "../../../../draw/Game";

interface ChatMessage {
  type: string;
  message: string;
  roomId: string;
  userId: number;
  user?: { username: string };
}


export default function RoomD() {

  const msgRef = useRef<HTMLInputElement|null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const toolRef = useRef<"line" | "rect" | "circle">("line")

  const [chatHis,setChatHis] = useState<ChatMessage[]>([])
  const [token,setToken] = useState('')
  const [roomId,setRoomId] = useState('')
  const [ws,setWs] = useState<WebSocket|null>(null);
  const [done,setDone] = useState(false)


  

  

  useEffect(()=>{
    setToken(Cookies.get("token") || "")
    setRoomId(Cookies.get("roomId") || "")
    console.log(`token from main page ${Cookies.get("token")} `)

  },[])

  useEffect(() => {
    if (token && roomId) {
      handleSignin();
    }
  }, [token, roomId]);

  
  
  
  const handleSignin = async ()=>{
    console.log("token inside signin",token," ",roomId)
    if(token === '' || roomId ===''){
      return 
    }
    const ws_url = `ws://localhost:8080?token=${token}`
    const ws = new WebSocket(ws_url);

    setWs(ws);

    ws.onopen= ()=>{
      console.log("WebSocket connected!");
      // console.log(ws_url)
      const join_req = {
        type:"join_room",
        roomId:roomId
      }
      setDone(true)
      ws.send(JSON.stringify(join_req))
      // initDrawn(canvasRef.current!,roomId,ws!,toolRef)
      const game  = new Game(canvasRef.current!,roomId,ws!,toolRef);
      
    }

    ws.onmessage= (e:MessageEvent)=>{
      console.log(`message recieved ${e.data}`)
      
      const parsedMsg = JSON.parse(e.data); 
      console.log("Parsed message:", parsedMsg);

      console.log(`Paersed message recieved ${JSON.stringify(parsedMsg.chats)}`)
      if (parsedMsg.type === "chat_history") {
        // Normalize history messages to { message, user: { username } }
        const normalized = parsedMsg.chats.map((c: any) => ({
          message: c.chats,
          user: c.users,
          userId: c.user_id,
          roomId: c.roomId,
          type: "chat"
        }));
        setChatHis(normalized);
      } else if (parsedMsg.type === "chat") {
        // New message from another user
        const normalized = {
          message: parsedMsg.message,
          user: parsedMsg.user,
          userId: parsedMsg.userId,
          roomId: parsedMsg.roomId,
          type: "chat"
        };
        setChatHis(prev => [...prev, normalized]);



    }
    ws.onclose = ()=>{
      console.log('connection closed')
    }

    // nav.push("/MainPage")

  }

  
    
    // setChatHis((prev) => [...prev, newMessage]);

    

  }
  function handleSend(){
    if(!msgRef.current || !ws) return
    const user_id = jwt.decode(token)
    console.log("this is so may ",user_id)
    const js_to_msg = {
      type:"chat",
      message: msgRef.current.value,
      roomId:roomId,
      userId:user_id.id,
      user:{username:Cookies.get('username') || "Anonymous"}
    }
    msgRef.current.value = '';
    setChatHis((prev)=>[...prev,js_to_msg]);
    ws.send(JSON.stringify(js_to_msg))
  }
  if(!token && !ws) return <div></div>
  const buttonStyles = " text-black p-4 hover:bg-slate-200 "
  return ( 
 <div>
    <div className="w-screen relative">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 bg-slate-400 rounded-lg gap-2 shadow max-w-max z-10">
      <button className={buttonStyles} onClick={()=>{toolRef.current = "circle"}}>Circle</button>
      <button className={buttonStyles} onClick={()=>{toolRef.current = "rect"}}>Rectangle</button>
      <button className={buttonStyles} onClick={()=>{toolRef.current = "line"}}>Line</button>
    </div>
</div>

  <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}
   ></canvas>
   </div>
      
   
      /* Welcome to {roomId}
       {token && <pre>{JSON.stringify(chatHis)}</pre>}

       {chatHis.map((chat, index) => (
         <p key={index}>
        {chat.user?.username || "Anonymous"} : {chat.message}
        </p>
        ))}
       <div>
       <input ref = {msgRef}/>
       <button onClick={()=>{handleSend()}}>Send msg</button>
       </div> */
)

}