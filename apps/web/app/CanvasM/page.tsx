

interface CanvasMProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function CanvasM({canvasRef}:CanvasMProps){
  const buttonStyles="bg-red-200"
  return  <div className="bg-red-200 h-screen w-screen"> 
    <div className="absolute top-0 left-0 bg-black rounded-lg flex gap-2 shadow max-w-max z-10">
    <button className={buttonStyles} >Crcle</button>
    <button className={buttonStyles} >Rectangle</button>
    <button className={buttonStyles}>Line</button>
    </div>

  {/* <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}
   ></canvas> */}
   </div>
   
}