import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa6c7d8);
scene.fog = new THREE.FogExp2(0xb8cbd2, .0045);
const camera = new THREE.PerspectiveCamera(74, innerWidth / innerHeight, .08, 370);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$("scene").appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xe5f2ff, 0xc3a886, 2.3);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe4b1, 3.2);
sun.position.set(-65, 95, 55);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -125; sun.shadow.camera.right = 125;
sun.shadow.camera.top = 135; sun.shadow.camera.bottom = -135;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
sun.shadow.bias = -.00015;
scene.add(sun);

const mat = (color, options={}) => new THREE.MeshStandardMaterial({ color, roughness: .88, ...options });
const stone = mat(0xd4bea0), lightStone=mat(0xeadbc0), paving=mat(0xbcae97), joint=mat(0xa89880);
const brick=mat(0xa8614b), ochre=mat(0xd1a174), gold=mat(0xbd9a56, {metalness:.25});
const dark=mat(0x35434a), roof=mat(0x995f4f), waterMat=mat(0x327e87,{roughness:.28, metalness:.18, transparent:true, opacity:.94});
const glass=mat(0x4d6670, {metalness:.15, roughness:.25});
const foliage=mat(0x527357), terracotta=mat(0xa56245);
const solids = [];
const animated = [];

function box(w,h,d, material, x,y,z, shadow=true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=shadow;
  mesh.receiveShadow=true;
  scene.add(mesh); return mesh;
}
function cylinder(rTop,rBottom,height, material,x,y,z, segments=12) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,height,segments),material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
function sphere(radius, material,x,y,z, width=16,height=10) {
  const m=new THREE.Mesh(new THREE.SphereGeometry(radius,width,height),material);
  m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;
}
function blocker(x,z,w,d) { solids.push({ x1:x-w/2-.45,x2:x+w/2+.45,z1:z-d/2-.45,z2:z+d/2+.45 }); }
function building(x,z,w,d,h,color,front="south") {
  const wall=mat(color);
  box(w,h,d,wall,x,h/2,z);
  box(w+1,.8,d+1,roof,x,h+.4,z);
  blocker(x,z,w,d);
  const onZ = front==="south" ? z+d/2+.035 : z-d/2-.035;
  const n=Math.max(2,Math.floor(w/3));
  for(let floor=0;floor<Math.max(1,Math.floor(h/4));floor++){
    for(let i=0;i<n;i++){
      const wx=x-w/2+(i+.5)*w/n;
      box(.95,1.48,.13,dark,wx,2.7+floor*3.6,onZ);
      box(1.3,.15,.3,lightStone,wx,1.95+floor*3.6,onZ+.11);
    }
  }
  box(w+.6,.35,d+.6,lightStone,x,h*.62,z);
  return wall;
}
function arch(x,y,z,width=2.25,height=3.8,depth=.48) {
  box(.45,height,depth,lightStone,x-width/2,y+height/2,z);
  box(.45,height,depth,lightStone,x+width/2,y+height/2,z);
  box(width+.45,.42,depth,lightStone,x,y+height-.12,z);
  const archCurve=new THREE.Mesh(new THREE.TorusGeometry(width/2-.17,.21,6,14,Math.PI),lightStone);
  archCurve.position.set(x,y+height-1,z);archCurve.rotation.z=Math.PI;
  archCurve.castShadow=true;scene.add(archCurve);
}
function arcade(x, direction) {
  const wall=mat(direction===-1?0xd9b592:0xdfc8a6);
  box(9,14,95,wall,x,7,-4);
  box(9.6,.7,96,lightStone,x,14.4,-4);
  blocker(x,-4,9,95);
  const face=x-direction*4.6;
  for(let z=-47;z<42;z+=6){
    // Portico columns read as an arcade from the square
    cylinder(.35,.4,4.4,lightStone,face,2.2,z,10);
    box(1.3,.65,1.2,lightStone,face,4.6,z);
    box(.28,1.4,1.3,dark,face+.1,8.8,z+2);
  }
  for(let z=-45;z<40;z+=6) box(.15,1.4,1.45,dark,face+.1,10,z);
}
function dome(x,y,z,r) {
  const geometry = new THREE.SphereGeometry(r,18,10,0,Math.PI*2,0,Math.PI/2);
  const m = new THREE.Mesh(geometry,mat(0x8aaca0,{metalness:.12}));
  m.position.set(x,y,z);m.castShadow=true;scene.add(m);
  cylinder(.23,.35,2.6,gold,x,y+r+1,z);
  sphere(.45,gold,x,y+r+2.5,z);
}

// A curated Piazza San Marco silhouette. Stylized and not geospatially exact.
box(58,.4,100,paving,0,-.22,-2,false);
for(let x=-27;x<=27;x+=5.5) box(.065,.015,100,joint,x,.001,-2,false);
for(let z=-51;z<=48;z+=5.5) box(58,.015,.06,joint,0,.003,z,false);
for(let i=0;i<7;i++) box(1,.015,62,stone,-20+i*6,.012,-4,false);
arcade(-34,-1); arcade(34,1);

// Basilica facade facing the piazza, with layered portals and domes.
box(48,18,15,lightStone,0,9,-62);
blocker(0,-62,48,15);
box(52,1.1,17,stone,0,18.4,-62);
for(let i=-2;i<=2;i++){
  const x=i*8.6;
  arch(x,0,-54.34,6.3,10.7,.7);
  box(3,6.5,.12,glass,x,4.2,-54.0);
  arch(x,11,-54.3,5.5,5.1,.65);
  box(3.2,3,.15,glass,x,13.2,-54.1);
}
for(const x of [-17,0,17]) dome(x,18.7,-63,7.3);
for(const x of [-9,9]) dome(x,18.8,-70,5.3);
for(let x=-23;x<=23;x+=4) cylinder(.28,.3,2.2,lightStone,x,20.6,-54.5);

// Campanile / clocktower.
box(7,41,7,brick,-18,20.5,-32);
blocker(-18,-32,7,7);
for(let h of [12,24,35]) box(7.7,.7,7.7,lightStone,-18,h,-32);
box(9,6,9,lightStone,-18,44,-32);
for(let side of [-1,1]) {
  box(2,3,.2,dark,-18+side*2,44,-27.4);
}
const cap=new THREE.Mesh(new THREE.ConeGeometry(6.3,10,4),mat(0x578275,{metalness:.25}));
cap.rotation.y=Math.PI/4;cap.position.set(-18,52,-32);cap.castShadow=true;scene.add(cap);
sphere(1,gold,-18,58,-32);

// Clocktower and facades on north-east.
building(40,-47,15,13,24,0xe5d2ad);
box(6,7,1,lightStone,36,19,-39.8);
cylinder(2,2,.2,gold,36,20,-39.1,32).rotation.x=Math.PI/2;
building(-47,-56,15,18,16,0xb87e65);
building(47,18,15,16,19,0xc99579);

// Columns at the opening to the waterfront.
for(const x of [-17,17]){
  cylinder(.85,1.05,13,lightStone,x,6.5,43);
  box(2.8,.7,2.8,stone,x,13.4,43);
  sphere(1.1,gold,x,14.8,43);
}

// Southern waterfront with an axial stone crossing.
box(58,.25,9,stone,0,-.15,50,false);
box(250,.1,30,waterMat,0,-.66,69,false);
for(let i=0;i<140;i++){
  const x=((i*91)%253)-126,z=55+((i*43)%30);
  const ripple=box(1.8+(i%4),.008,.035,mat(i%2?0x78b2ab:0xa3c5b9,{transparent:true,opacity:.34}),x,-.58,z,false);
  animated.push({mesh:ripple,seed:i});
}
box(13,1,28,stone,0,.1,69);
box(13,1.1,2,stone,0,.65,55.5);
box(13,1.1,2,stone,0,.65,82);
for(const x of [-6.8,6.8]){
  for(let z=56;z<=82;z+=2.8) cylinder(.15,.18,1.2,lightStone,x,1.1,z);
  box(.2,.25,27,lightStone,x,1.8,69);
}
box(77,.5,54,stone,0,-.2,108,false);
for(let x=-35;x<=35;x+=14) {
  building(x,126,12,16,12+(Math.abs(x*3)%8),[0xd5a27c,0xc58b71,0xe4c19a][Math.abs(x/14)%3],"north");
  building(x,91,12,12,13+(Math.abs(x)%6),[0xdfbb8d,0xc7886e,0xe5c29b][Math.abs(x/14)%3],"south");
}
// Little market-side street on the right of the square.
box(48,.3,12,stone,52,-.15,10,false);
for(let i=0;i<5;i++) {
  building(45+i*12,-3,10,12,12+(i%3)*3,[0xd2a17b,0xe8c9a4,0xbe8976][i%3],"south");
  building(45+i*12,24,10,13,13+(i%2)*4,[0xca9875,0xd8b38a,0xc18464][(i+1)%3],"north");
}

// Details: benches, planters, lamps, and distant mooring posts.
function planter(x,z){
  cylinder(.8,.68,1.1,terracotta,x,.55,z);
  sphere(1.55,foliage,x,2.1,z);
  blocker(x,z,1.6,1.6);
}
for(const [x,z] of [[-23,28],[23,26],[-22,-10],[22,-12],[18,100],[-18,105]]) planter(x,z);
function lamp(x,z){
  cylinder(.09,.14,4,dark,x,2,z);
  sphere(.38,mat(0xffe1a7,{emissive:0x6c4d1f,emissiveIntensity:.25}),x,4.15,z);
}
for(const [x,z] of [[-24,34],[24,34],[23,-24],[-24,-45],[-10,100],[10,100]]) lamp(x,z);
for(let x=-30;x<=30;x+=8) cylinder(.32,.42,3.5,mat(0x6c665b),x,1.25,53);
for(let i=0;i<5;i++){
 const x=-100+i*40;
 building(x,150,24,18,15+i*2,[0xd3a381,0xb77e69,0xe2b58c][i%3]);
}

// Tiny gondolas as recognizable silhouettes.
function boat(x,z,rot) {
 const hull=new THREE.Mesh(new THREE.CapsuleGeometry(1,7,4,8),mat(0x253d40,{metalness:.1}));
 hull.rotation.x=Math.PI/2;hull.rotation.z=rot;
 hull.position.set(x,-.25,z);scene.add(hull);
 box(1.2,.3,3,mat(0x8f5d43),x,-.05,z,false);
}
boat(-27,66,.12);boat(27,72,-.2);

const START = new THREE.Vector3(1,1.72,23);
const player = START.clone();
let yaw=0,pitch=-.045,playing=false,last=performance.now();
const pressed=new Set();
const walkZones=[
 {x1:-27,x2:27,z1:-50,z2:55.5},
 {x1:-6,x2:6,z1:54,z2:84},
 {x1:-37,x2:37,z1:83,z2:120},
 {x1:25,x2:75,z1:3,z2:16}
];
const inside = (x,z)=>walkZones.some(a=>x>=a.x1&&x<=a.x2&&z>=a.z1&&z<=a.z2);
function clearPosition(x,z) {
 if (!inside(x,z)) return false;
 for (const b of solids) if(x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2)return false;
 return true;
}
function syncCamera(){camera.position.copy(player);camera.rotation.order="YXZ";camera.rotation.y=yaw;camera.rotation.x=pitch;}
function reset(){player.copy(START);yaw=0;pitch=-.045;pressed.clear();syncCamera();$("status").textContent="Back at Piazza San Marco";}
function tick(now){
 requestAnimationFrame(tick);
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(playing){
  const f=Number(pressed.has("KeyW")||pressed.has("ArrowUp"))-Number(pressed.has("KeyS")||pressed.has("ArrowDown"));
  const s=Number(pressed.has("KeyD")||pressed.has("ArrowRight"))-Number(pressed.has("KeyA")||pressed.has("ArrowLeft"));
  const len=Math.hypot(f,s);
  if(len){
   const speed=pressed.has("ShiftLeft")||pressed.has("ShiftRight")?5.3:2.65;
   const forward=f/len,right=s/len;
   const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed*dt;
   const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed*dt;
   if(clearPosition(player.x+dx,player.z))player.x+=dx;
   if(clearPosition(player.x,player.z+dz))player.z+=dz;
  }
  $("area").textContent=player.z>84?"Across the canal":player.z>56?"The little bridge":player.x>29?"The side streets":"Piazza San Marco";
  syncCamera();
 }
 for(const r of animated)r.mesh.position.y=-.58+Math.sin(now*.0006+r.seed)*.025;
 renderer.render(scene,camera);
}
syncCamera();requestAnimationFrame(tick);
$("loading").classList.add("hidden");
$("begin").addEventListener("click",()=>{
 playing=true;
 $("intro").classList.add("hidden");$("hud").classList.remove("hidden");
 renderer.domElement.requestPointerLock?.();
});
renderer.domElement.addEventListener("click",()=>{
 if(playing&&!$("info").classList.contains("hidden"))return;
 if(playing&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();
});
document.addEventListener("mousemove",e=>{
 if(document.pointerLockElement!==renderer.domElement)return;
 yaw-=e.movementX*.0023;
 pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0023,-1.35,1.35);
});
document.addEventListener("keydown",e=>{
 if(!playing)return;
 if(/^(Key[WASD]|Arrow(Up|Down|Left|Right)|Shift(Left|Right))$/.test(e.code)){pressed.add(e.code);e.preventDefault();}
});
document.addEventListener("keyup",e=>pressed.delete(e.code));
window.addEventListener("blur",()=>pressed.clear());
document.addEventListener("pointerlockchange",()=>{
 $("status").textContent=document.pointerLockElement===renderer.domElement?"WASD to walk · Esc to release mouse":"Click the world to look around";
});
$("reset").addEventListener("click",reset);
$("about").addEventListener("click",()=>{document.exitPointerLock?.();$("info").classList.remove("hidden");});
$("closeInfo").addEventListener("click",()=>$("info").classList.add("hidden"));
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
