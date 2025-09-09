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


export class Game {
  private canvas: HTMLCanvasElement;
  private ctx:CanvasRenderingContext2D;
  private roomId:string;
  private socket:WebSocket;
  private clicked:boolean;
  private startX=0;
  private startY =0;
  private existingShapes:Shapes[]=[];
  private toolRef:React.RefObject<Tool>;


  constructor(canvas:HTMLCanvasElement,roomId:string,socket:WebSocket,toolRef:React.RefObject<Tool>){
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')!
    this.roomId = roomId
    this.socket = socket;
    this.clicked = false;
    this.init()
    this.initLoaders()
    this.initAddHandlers()
    this.toolRef=toolRef


  }

  async init(){
    this.existingShapes = await this.getExistingShapes() || [];
    this.clearCanvas()

  }

  async initLoaders(){
    if(this.socket){
      this.socket.onmessage = (e)=>{
        
        const message = JSON.parse(e.data);
        // console.log(`Event recieved ${message}`)
    
        if(message.type==="chat"){
          console.log(message)
          const parsedShape = JSON.parse(message.message);
          this.existingShapes.push(parsedShape)
  
          this.clearCanvas()
        }
      }
    }
  }

  async getExistingShapes(){
    try{
      const res =await axios.get(`http://localhost:3000/chats/${this.roomId}`)
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

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = "black"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.map((e)=>{
      if(e.type==="rect"){
        this.ctx.strokeStyle = "white";
        this.ctx.strokeRect(e.startX, e.startY, e.width, e.height);
      }  else if(e.type === "circle"){
        this.ctx.beginPath()
        const x1 = e.x1
        const y1 = e.y1
        const x2= e.x2
        const y2 = e.y2

        // const radius = Math.sqrt((((x2-x1)**2)*((y2-y1))**2))
        const dx = x2 - x1;
        const dy = y2 - y1;
        const radius = Math.sqrt(dx * dx + dy * dy);
      
        this.ctx.arc(x1,y1,radius,0,2*Math.PI)
        this.ctx.stroke();

      } else{
        this.ctx.beginPath();

        this.ctx.moveTo(e.x1,e.y1)
        this.ctx.lineTo( e.x2,e.y2)
        this.ctx.stroke();

      }

    })
    
  }

  

  mouseDownHandler = (e: MouseEvent) => {

    this.clicked = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
  }

  mouseUpHandler = (e: MouseEvent) => {
    try {
      if (!this.clicked) return;
      this.clicked = false;

      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;
      // console.log("Tool selected ",toolRef.current)
      this.ctx.strokeStyle = "white";
      let shape:Shapes|null=null
      if(this.toolRef.current === "rect"){
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        const rect:Shapes = {type:"rect",startX:this.startX,startY:this.startY, width, height}
        this.existingShapes.push(rect)
        shape = rect;
      } else if(this.toolRef.current === "circle"){
        

        this.ctx.beginPath()
        const x1 = this.startX
        const y1 = this.startY
        const x2= e.clientX
        const y2 = e.clientY

        const dx = x2 - x1;
        const dy = y2 - y1;
        const radius = Math.sqrt(dx * dx + dy * dy);
      
        this.ctx.arc(x1,y1,radius,0,2*Math.PI)
        this.ctx.stroke();
        const circle:Shapes = {type:"circle",x1, y1, x2, y2}
        this.existingShapes.push(circle)
        shape= circle

      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX,this.startY)
        this.ctx.lineTo( e.clientX,e.clientY)
        const lines:Shapes={type:"line",x1:this.startX, y1:this.startY, x2:e.clientX, y2:e.clientY}
        this.existingShapes.push(lines)
        this.ctx.stroke();
        shape=lines;

      }
      
     if(this.socket){
      this.socket.send(JSON.stringify({
        type:"chat",
        message:JSON.stringify(shape),
        roomId:this.roomId
      }))
      console.log(` sent ${shape}`)

     } else{
      console.log("looks bad")
     }
        
      
      


    } catch (err) {
      console.log(err)
    }
  }

  mouseMoveHandler = (e: MouseEvent) => {
    try {
      if (this.clicked) {
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        this.clearCanvas();
        this.ctx.strokeStyle = "white";
        if(this.toolRef.current === "rect"){
          
          this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if(this.toolRef.current === "circle"){
          this.ctx.beginPath()
          const x1 = this.startX
          const y1 = this.startY
          const x2= e.clientX
          const y2 = e.clientY

          const dx = x2 - x1;
          const dy = y2 - y1;
          const radius = Math.sqrt(dx * dx + dy * dy);
          
          this.ctx.arc(this.startX,this.startY,radius,0,2*Math.PI)
          this.ctx.stroke();
  
        } else {
          // this.ctx.beginPath()
          this.ctx.beginPath();

          this.ctx.moveTo(this.startX,this.startY)
          this.ctx.lineTo( e.clientX,e.clientY)
          this.ctx.stroke();
        }

      }

    } catch (err) {
      console.log(err)
    }
  }

  initAddHandlers(){
    this.canvas.addEventListener("mousedown",this.mouseDownHandler)
    this.canvas.addEventListener("mousemove",this.mouseMoveHandler)
    this.canvas.addEventListener("mouseup",this.mouseUpHandler)
  }

}