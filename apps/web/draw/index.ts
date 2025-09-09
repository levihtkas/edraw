// import { HTTP_BACKEND } from "../config";
import axios from "axios";

type Shape ={
  type:"rect",
  x:number,
  y:number,
  width:number,
  height:number
} | {
  type:"circle",
  x:number,
  y:number,
  radius:number
} |
{
  type:"line",
  x:number,
  y:number,
  x1:number,
  y1:number
  
}
export async function initDraw (canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, toolRef:React.RefObject<"circle" | "rect" | "line">
){
  const ctx = canvas.getContext("2d");

  //@ts-ignore
  let existingShapes:Shape[] = await getExistingShapes(roomId) ;
  //@ts-ignore
  console.log("Logged clear"+existingShapes)
  if(!ctx){
    return
  }

  socket.onmessage= ((event)=>{
    const message = JSON.parse(event.data);

    if(message.type === "chat"){
      const parsedShape = JSON.parse(message.message)
      existingShapes.push(parsedShape)
      clearCanvas(existingShapes,canvas,ctx);
    }

  })

  ctx.fillStyle = "black"
  ctx.fillRect(0,0,canvas.width,canvas.height);

  let clicked = false;
  let startX = 0;
  let startY = 0;
  
  

  canvas.addEventListener("mousedown",(e)=>{
    clicked=true;
    startX = e.clientX;
    startY = e.clientY;
    console.log(e.clientX)
    console.log(e.clientY)
  })

  canvas.addEventListener("mouseup",(e)=>{
    try{
      if (!clicked) return;
      clicked = false;
    
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      let shape:Shape;
      const tool = toolRef.current;
    
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.fillStyle = "black";
      // ctx.fillRect(0, 0, canvas.width, canvas.height);
    
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      if(tool =="rect"){
        ctx.strokeRect(startX, startY, width, height);
        existingShapes.push({type:"rect",x:startX,y:startY,height,width});
         shape = {type:"rect",x:startX,y:startY,height,width};
      } else if(tool == "circle"){
        const radius = Math.sqrt(width**2+height**2);
        ctx.arc(startX,startY,radius,0,2*Math.PI);
         shape = {type:"circle",x:startX,y:startY,radius};
         ctx.stroke();

      } else {
        ctx.moveTo(startX,startY);
        ctx.lineTo(e.clientX,e.clientY);
        ctx.stroke();
        shape = {type:"line",x:startX,y:startY,x1:e.clientX,y1:e.clientY};
      }      
        
  
        socket.send(JSON.stringify({
          type:'chat',
          message:JSON.stringify(shape),
          roomId:roomId
        }))

    } catch (e){
      console.log("Error encountered in mouseup")
    } 
 

    
  })

  canvas.addEventListener("mousemove",(e)=>{
    if(clicked){

      const width = e.clientX  -startX;
      const height = e.clientY-startY
      clearCanvas(existingShapes,canvas,ctx)
      

      // ctx.strokeStyle = "white"
      // ctx.strokeRect(startX,startY,width,height);
      const tool = toolRef.current;
      if(tool =="rect"){
        ctx.strokeRect(startX, startY, width, height);
       
         
      } else if(tool == "circle"){
        ctx.beginPath();
        const radius = Math.sqrt(width**2+height**2);
        ctx.arc(startX,startY,radius,0,2*Math.PI);
        ctx.stroke()
         
      } else {
        ctx.beginPath();
        ctx.moveTo(startX,startY);
        ctx.lineTo(e.clientX,e.clientY);
        ctx.stroke();
      }   
      
      
    }
  })

    // ctx?.strokeRect(25,25,100,100)      

    }
  
    function clearCanvas(existingShapes:Shape[],canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "rgba(0,0,0)"
      ctx.fillRect(0,0,canvas.width,canvas.height);
      
      existingShapes.map((shape)=>{
        if(shape.type ==="rect"){
          ctx.strokeStyle = "white"
          ctx.strokeRect(shape.x,shape.y,shape.width,shape.height);
        }
        if (shape.type === "circle") {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (shape.type === "line") {
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y);
          ctx.lineTo(shape.x1, shape.y1);
          ctx.stroke();
        }
      })
    }
 

    async function getExistingShapes(roomId:string){
      try{
        const res = await axios.get(`http://localhost:3000/chats/${roomId}`);
        //@ts-ignore
      const messages = res.data.messages;

      const shapes = messages.map((x:{message:string})=>{
        //@ts-ignore
        const shape = JSON.parse(x.message);
        return JSON.parse(x.message)
        })
        // console.log(shapes)
        return shapes

      }
      catch (e){
        console.log("Failed in getting shapes")
        return []
      }
      
      
      
    
    }