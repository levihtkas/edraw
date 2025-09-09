
interface Shapes {
  type:"rect",
  startX:number,
  startY:number,
  width:number,
  height:number
}
export async function initDrawn(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const existingShapes:Shapes[] = []

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

      ctx.strokeStyle = "white";
      ctx.strokeRect(startX, startY, width, height);
      existingShapes.push({type:"rect",startX, startY, width, height})


    } catch (err) {
      console.log(err)
    }
  })

  canvas.addEventListener("mousemove", (e) => {
    try {
      if (clicked) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;

        clearCanvas(ctx);

        ctx.strokeStyle = "white";
        ctx.strokeRect(startX, startY, width, height);
      }

    } catch (err) {
      console.log(err)
    }
  })

  function clearCanvas(ctx:CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    existingShapes.map((e)=>{
      if(e.type==="rect"){
        ctx.strokeStyle = "white";
        ctx.strokeRect(e.startX, e.startY, e.width, e.height);
      }
    })
    
  }

}