// ------------ JS ------------- //

var Input = {
    keys: new Map(),
    keyDown: function(keyName)
    {
        return Input.keys.get(keyName);
    },

    keyUp: function(keyName)
    {
        return !Input.keys.get(keyName);
    },
    
    keyPressed: function(keyName)
    {
        var pressed = this.keyDown(keyName);
        if (pressed)
        {
            this.keys.set(keyName, false);
        }
        return pressed;
    }
};


// ------------ WASM ------------- //

log("run");
canvas.tabIndex = 1000000;

var wasmModule = new WebAssembly.Module(wasmCode);
var wasmInstance = new WebAssembly.Instance(wasmModule, wasmImports);
var ctx = canvas.getContext('2d');

let setBlocks = new Int8Array(wasmInstance.exports.memory.buffer,
	                    wasmInstance.exports.getBoard(-1), 
	                    10*20);
	                    
let playBlocks = new Int8Array(wasmInstance.exports.memory.buffer,
                                  wasmInstance.exports.getBoard(1),
                                  2000);
var graphics, gl, posBuffer;



// ------------ GL ------------- //
//            nvm lol            //
// ------------ GL ------------- //



var time = 1;
var pause = false;
const size = 48;
const blockColors = [
  "#00aaff",
  "#ff0090",
  "#ffdd00",
  "#bfff00",
  "#59ff00",
  "#00ffbb",
  "#00aeff",
  "#8300ff",
];

let DASTimer = 0;
const DASMax = 5;
let lastMove = 0;
const OFFSCREEN_OFFSET = 500;

let pieces = [2,3,4,0,6,5,1];
let curPiece = pieces[0];
let pieceBackBuffer = [1,5,0,2,3,4,6];

function input()
{
  let xmove = boolInt(Input.keyDown('ARROWRIGHT')) - boolInt(Input.keyDown('ARROWLEFT'));
  
  let rot = boolInt(Input.keyPressed('ARROWUP')) - boolInt(Input.keyPressed('Z'));
  if (xmove === lastMove) DASTimer++;
  else if (DASTimer > 0)// hit key, broke chain
  {
    wasmInstance.exports.input(xmove, 0);
    DASTimer = 0;
  }
  wasmInstance.exports.input(0, rot);
  
  if (DASTimer >= DASMax) wasmInstance.exports.input(xmove, 0)
  
  // specials
  
  if (Input.keyDown("ARROWDOWN")) 
    wasmInstance.exports.tick(time, curPiece);
  if (Input.keyPressed(" ")) 
    wasmInstance.exports.hardDrop();
  if(Input.keyPressed('P')) 
    pause = !pause;
  if (Input.keyPressed('C'))
    wasmInstance.exports.hold();
    
  lastMove = boolInt(Input.keyDown('ARROWRIGHT')) - boolInt(Input.keyDown('ARROWLEFT'));
}

function f()
{
    input();
    if (wasmInstance.exports.getPieceSet())
    {
      pieceBackBuffer.splice(Math.floor(Math.random()*6), 0, curPiece)
      curPiece = pieces.shift();
      pieces.push(pieceBackBuffer[0]);
      pieceBackBuffer.splice(0,1);
    }
    
    if (!pause) time++;
    ctx.clearRect(0,0,2000,2000);
  
	  if((time % 3 === 0 && !pause) || Input.keyPressed('U')) 
	  {
	    wasmInstance.exports.tick(time, curPiece);
	  }
	  
	  for(let z = 0; z < setBlocks.length-10; z++)
	  {
	      ctx.fillStyle = (setBlocks[z] !== 0 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)");
          ctx.globalAlpha = ctx.fillStyle === blockColors[0] ? 0.2 : 0.7;
          ctx.globalCompositeOperation = "multiply";
	      ctx.fillRect(size+(z%10)*size-size/8, size+Math.floor(z/10)*size-size/8, size, size);
	  }
    ctx.globalCompositeOperation = "source-over";
    
    for(let i = 0; i < setBlocks.length; i++)
    {
	       ctx.fillStyle = blockColors[setBlocks[i]];
	        ctx.globalAlpha = ctx.fillStyle === blockColors[0] ? 0.0 : 1.0;
	        ctx.fillRect(size+(i%10)*size+2+Math.sin((time/30)%10)*2, 
	                     size+Math.floor(i/10)*size+2+Math.sin((time/30)%10)*2,
	                     size, size);
     }
    for(let i = 0; i < playBlocks.length; i++)
    {
        ctx.fillStyle = blockColors[playBlocks[i]];
        if (playBlocks[i] > 0) 
        {
	        ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = "source-over";
	        ctx.fillRect(size+(i%10)*size, size+Math.floor(i/10)*size, size-2, size-2);
        }
    }
    
    for(i = 0; i < pieces.length; i++)
    {
      ctx.fillStyle = blockColors[pieces[i]];
      ctx.fillRect(OFFSCREEN_OFFSET+size*4, size*3+size*2*i, size, size);
    }
	  window.requestAnimationFrame(f);
}
f();
lib.showCanvas();

document.body.style = "background-color: black;";

function boolInt(bool)
{
  return bool ? 1 : 0;
}

canvas.addEventListener('keydown', (key) =>
{
  const keyName = key.key.toUpperCase();
  Input.keys.set(keyName, true);
});

canvas.addEventListener('keyup', (key) =>
{
  const keyName = key.key.toUpperCase();
  Input.keys.set(keyName, false);
});
