"use client"
import { useRef,useState } from "react";
import Cookies from "js-cookie"; 
import axios from "axios";
import { useRouter } from "next/navigation";
interface SigninResponse {
  token: string;
}



export default function Home() {
  
  const usernameRef= useRef<HTMLInputElement |null>(null);
  const passwordRef = useRef<HTMLInputElement |null>(null);
  const roomRef = useRef<HTMLInputElement |null>(null);

  const nav = useRouter();

  const handleSignin = async ()=>{
    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;
    const roomId = roomRef.current?.value; 
    

    const res = await axios.post<SigninResponse>("http://localhost:3000/signin",{
      username:username,
      password:password
    })

    const token = res.data.token;
    Cookies.set("token", token, { expires: 1 }); 
    Cookies.set("roomId", roomId || "");
    Cookies.set("username",username||"")


    nav.push(`/room/${roomId}`)

  }

  return (
   <div className="bg-black flex items-center justify-center h-screen w-screen">
    <form action={handleSignin} className="flex bg-slate-200 gap-10">
    <input className="" ref={roomRef} placeholder="Room"/>
    <input ref={usernameRef} placeholder="username"/>
    <input ref={passwordRef} placeholder="password" type="password"/>

    <button className="">Join Room</button>
    </form>

   </div>
  );
}
