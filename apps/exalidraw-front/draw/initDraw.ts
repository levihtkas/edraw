import axios from "axios";
type Shapes = {
  type:"rect",
  startX:number,
  startY:number,
  width:number,
  height:number
} | {
  type:"circle",
  x1:number,
  y1:number,
  x2:number,
  y2:number
} | {
  type:"line",
  x1:number,
  y1:number,
  x2:number,
  y2:number
}
type Tool = "line" | "rect" | "circle";

export async function initDrawn(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket,toolRef:React.RefObject<Tool>
) {
  const ctx = canvas.getContext('2d')
  let existingShapes:Shapes[] = await getExistingShapes(roomId) || []
  

  
  if (!ctx) return
  clearCanvas(ctx,existingShapes);

  if(socket){
    socket.onmessage = (e)=>{
      
      const message = JSON.parse(e.data);
      // console.log(`Event recieved ${message}`)
  
      if(message.type==="chat"){
        console.log(message)
        const parsedShape = JSON.parse(message.message);
        existingShapes.push(parsedShape)

        clearCanvas(ctx,existingShapes)
      }
    }
  }
  
  // ctx.fillStyle = "black"
  // ctx.fillRect(0, 0, canvas.width, canvas.height);


  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  })

  canvas.addEventListener("mouseup", (e) => {
    try {
      if (!clicked) return;
      clicked = false;

      const width = e.clientX - startX;
      const height = e.clientY - startY;
      // console.log("Tool selected ",toolRef.current)
      ctx.strokeStyle = "white";
      let shape:Shapes|null=null
      if(toolRef.current === "rect"){
        ctx.strokeRect(startX, startY, width, height);
        const rect:Shapes = {type:"rect",startX, startY, width, height}
        existingShapes.push(rect)
        shape = rect;
      } else if(toolRef.current === "circle"){
        

        ctx.beginPath()
        const x1 = startX
        const y1 = startY
        const x2= e.clientX
        const y2 = e.clientY

        const dx = x2 - x1;
        const dy = y2 - y1;
        const radius = Math.sqrt(dx * dx + dy * dy);
      
        ctx.arc(x1,y1,radius,0,2*Math.PI)
        ctx.stroke();
        const circle:Shapes = {type:"circle",x1, y1, x2, y2}
        existingShapes.push(circle)
        shape= circle

      } else {
        ctx.beginPath();
        ctx.moveTo(startX,startY)
        ctx.lineTo( e.clientX,e.clientY)
        const lines:Shapes={type:"line",x1:startX, y1:startY, x2:e.clientX, y2:e.clientY}
        existingShapes.push(lines)
        ctx.stroke();
        shape=lines;

      }
      
     if(socket){
      socket.send(JSON.stringify({
        type:"chat",
        message:JSON.stringify(shape),
        roomId:roomId
      }))
      console.log(` sent ${shape}`)

     } else{
      console.log("looks bad")
     }
        
      
      


    } catch (err) {
      console.log(err)
    }
  })

  canvas.addEventListener("mousemove", (e) => {
    try {
      if (clicked) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;

        clearCanvas(ctx,existingShapes);
        ctx.strokeStyle = "white";
        if(toolRef.current === "rect"){
          
          ctx.strokeRect(startX, startY, width, height);
        } else if(toolRef.current === "circle"){
          ctx.beginPath()
          const x1 = startX
          const y1 = startY
          const x2= e.clientX
          const y2 = e.clientY

          const dx = x2 - x1;
          const dy = y2 - y1;
          const radius = Math.sqrt(dx * dx + dy * dy);
          
          ctx.arc(startX,startY,radius,0,2*Math.PI)
          ctx.stroke();
  
        } else {
          // ctx.beginPath()
          ctx.beginPath();

          ctx.moveTo(startX,startY)
          ctx.lineTo( e.clientX,e.clientY)
          ctx.stroke();
        }

      }

    } catch (err) {
      console.log(err)
    }
  })



  async function getExistingShapes(roomId:string){
    try{
      const res =await axios.get(`http://localhost:3000/chats/${roomId}`)
      //@ts-ignore
      const messages = res.data.message;
      console.log("array message",messages.chats);
      //@ts-ignore
      const shapes:Shapes[] = messages.map((m)=>JSON.parse(m.chats))
      console.log(`Shapes ${JSON.stringify(shapes)}`)
      return shapes

    } catch(e){
      console.log(e)
    }
  }


  function clearCanvas(ctx:CanvasRenderingContext2D,existingShapes:Shapes[]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    existingShapes.map((e)=>{
      if(e.type==="rect"){
        ctx.strokeStyle = "white";
        ctx.strokeRect(e.startX, e.startY, e.width, e.height);
      }  else if(e.type === "circle"){
        ctx.beginPath()
        const x1 = e.x1
        const y1 = e.y1
        const x2= e.x2
        const y2 = e.y2

        // const radius = Math.sqrt((((x2-x1)**2)*((y2-y1))**2))
        const dx = x2 - x1;
        const dy = y2 - y1;
        const radius = Math.sqrt(dx * dx + dy * dy);
      
        ctx.arc(x1,y1,radius,0,2*Math.PI)
        ctx.stroke();

      } else{
        ctx.beginPath();

        ctx.moveTo(e.x1,e.y1)
        ctx.lineTo( e.x2,e.y2)
        ctx.stroke();

      }

    })
    
  }

}