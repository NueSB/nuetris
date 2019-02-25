//
// due to the current dev environment, tldr 
// we gotta move to js for regular tetris dev
// wasm atm doens't have any online compilers
// at the scale that i'm working with so for
// the sake of time and my sanity we're switching
// to vanilla js
//

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

var Graphics = {
  camera: null,
  renderer: null,
  scene: null,
  light: null,
  composer: null,
  outlinePass: null,
  meshes: [],

  init: function()
  {
    this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.01, 90);
    //this.camera.position.x = 10;
    this.camera.position.z = 60;
    this.camera.position.y = 12;
    this.camera.updateProjectionMatrix();

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({antialias: false});
    this.renderer.setSize(window.innerWidth/1.2, window.innerHeight/1.2);
    document.body.appendChild(this.renderer.domElement);
    
    this.composer = new THREE.EffectComposer(this.renderer);
var renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
    this.outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
    this.outlinePass.edgeStrength = 10;
    this.outlinePass.edgeThickness = 4;
    this.outlinePass.visibleEdgeColor = new THREE.Color(0xff0000);
    this.composer.addPass(this.outlinePass);

    this.light = new THREE.PointLight( 0xaa11ff );
    this.light.position.y = 10000.0;
    this.light.rotateZ(90 * (Math.PI/180));
    this.scene.add(this.light);
    this.scene.add(new THREE.AmbientLight( 0xafafaf ));
    
    for(var i = 0; i < 200; i++)
    {
      var geometry = new THREE.BoxGeometry(1,1,1);
      var material = new THREE.MeshBasicMaterial({color: 0xff0000});
      let cubeMesh = new THREE.Mesh(geometry, material);
      this.meshes.push(cubeMesh);
      cubeMesh.position.x = (i % 10 * 1.1);
      cubeMesh.position.y = -(Math.floor(i / 10) * 1.1)+20;
      this.light.target = this.meshes[i];
      this.scene.add(this.meshes[i]);
    }
  }
}
//////////////////////////////////////////////


var wasmInstance, playBlocks, setBlocks;

var time = 1;
var pause = false;
const size = 16;
const blockColors = [
  [0x000000, 0.0],
  [0xaa00ff, 1.0],
  [0xffdd00, 1.0],
  [0xff0090, 1.0],
  [0xbfff00, 1.0],
  [0x59ff00, 1.0],
  [0x00ffbb, 1.0],
  [0x00aeff, 1.0],
  [0x8300ff, 1.0],
];

const blockMats = [];
for (let i = 0; i < blockColors.length; i++) 
  blockMats[i] = new THREE.MeshPhysicalMaterial({color: blockColors[i][0],
									metalness: 0.1,
									roughness: 0.0});

var DASMax = 5;
var OFFSCREEN_OFFSET = 500;

var DASTimer = 0;
var lastMove = 0;

let pieces = [2,3,4,0,6,5,1];
let curPiece = pieces[0];
let pieceBackBuffer = [1,5,0,2,3,4,6];

console.log("test");
fetch('./program.wasm').then(response =>
  response.arrayBuffer()
).then(bytes => WebAssembly.instantiate(bytes)).then(results => {
  wasmInstance = results.instance;
  setBlocks = new Int8Array(wasmInstance.exports.memory.buffer,
	                    wasmInstance.exports.getBoard(-1), 
	                    10*20);
	                    
  playBlocks = new Int8Array(wasmInstance.exports.memory.buffer,
                                  wasmInstance.exports.getBoard(1),
                                  10*20);
  console.log("gucci.");
  Graphics.init();
  f();
}).catch(console.error);


// ------------ GL ------------- //

// ------------ GL ------------- //

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
  {
    wasmInstance.exports.hardDrop();
    pieceBackBuffer.splice(Math.floor(Math.random()*6), 0, curPiece)
    var a = Math.floor(Math.random()*6);
    if (a === curPiece)
    {
      a = Math.floor(Math.random()*6);
      if (a === curPiece) a = Math.floor(Math.random()*6);
    }
    curPiece = a;
    pieces.push(pieceBackBuffer[0]);
    pieceBackBuffer.splice(0,1);
  }
  
  if(Input.keyPressed('P')) 
    pause = !pause;

  if (Input.keyPressed('C'))
    wasmInstance.exports.hold();
    
  lastMove = boolInt(Input.keyDown('ARROWRIGHT')) - boolInt(Input.keyDown('ARROWLEFT'));
}

function f()
{
    input();
    Graphics.outlinePass.selectedObjects = [];
    Graphics.light.rotateZ(3 * (Math.PI/180));

    if (wasmInstance.exports.getPieceSet())
    {
      pieceBackBuffer.splice(Math.floor(Math.random()*6), 0, curPiece)
      var a = Math.floor(Math.random()*7);
      if (a === curPiece)
      {
         a = Math.floor(Math.random()*7);
         if (a === curPiece) a = Math.floor(Math.random()*7);
      }
      curPiece++;
      pieces.push(pieceBackBuffer[0]);
      pieceBackBuffer.splice(0,1);
    }
    
    
    
    Graphics.camera.updateProjectionMatrix();
    if (!pause) time++;
  
	  if((time % 3 === 0 && !pause) || Input.keyPressed('U')) 
	  {
	    wasmInstance.exports.tick(time, curPiece);
	  }

    for (let i = 0; i < setBlocks.length-10; i++)
    {
      let col = blockMats[setBlocks[i]];
      Graphics.meshes[i].material = col;
      if (setBlocks[i] > 0)
      {
        Graphics.outlinePass.selectedObjects = (Graphics.meshes[i]);
      }
      
    }
    for(i = 0; i < playBlocks.length-10; i++)
    {
      if (playBlocks[i] > 0) Graphics.meshes[i].material = blockMats[playBlocks[i]];
    }
    Graphics.renderer.render(Graphics.scene, Graphics.camera);
    Graphics.composer.render();
	  window.requestAnimationFrame(f);
}

document.body.style = "background-color: black;";

function boolInt(bool)
{
  return bool ? 1 : 0;
}

window.addEventListener('keydown', (key) =>
{
  const keyName = key.key.toUpperCase();
  Input.keys.set(keyName, true);
});

window.addEventListener('keyup', (key) =>
{
  const keyName = key.key.toUpperCase();
  Input.keys.set(keyName, false);
});
