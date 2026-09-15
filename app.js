import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SCALE, X, Z, outline, rooms, walls, windows, doors, inside } from './plan.js';

const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#edece5');
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$('#viewport').append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','3D apartment. Drag to orbit; choose Walk inside for keyboard movement.');
const camera = new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.05,150);
const orbit = new OrbitControls(camera,renderer.domElement);
orbit.enableDamping = true;
orbit.minDistance=7; orbit.maxDistance=65;
orbit.maxPolarAngle=Math.PI*.47;
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmrem.fromScene(environment,.04).texture;
scene.environmentIntensity=.32;
environment.dispose(); pmrem.dispose();
const hemi = new THREE.HemisphereLight('#fff4df','#9caa91',2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d6',3.5); sun.position.set(-5,12,-9); scene.add(sun);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:40});
sun.shadow.normalBias=.02; sun.shadow.bias=-.0001; sun.shadow.radius=3; sun.shadow.blurSamples=8;
const fill = new THREE.DirectionalLight('#dbe5ee',1); fill.position.set(7,8,9); scene.add(fill);
const architecture = new THREE.Group(), glazing = new THREE.Group(), overhead = new THREE.Group();
scene.add(architecture,glazing,overhead);
const colliders=[];
function material(color,roughness=.75,other={}){return new THREE.MeshStandardMaterial({color,roughness,...other});}
function texture(kind) {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');
  let seed=42; const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  if(kind==='oak') {
    c.fillStyle='#bba17b'; c.fillRect(0,0,512,512);
    for(let i=0;i<8;i++) {
      c.fillStyle=`hsl(34 29% ${61+rand()*10}%)`; c.fillRect(i*64,0,63,512);
      for(let j=0;j<160;j++) {c.strokeStyle=`rgba(82,55,26,${rand()*.12})`;c.lineWidth=.3+rand();c.beginPath();const x=i*64+rand()*62;c.moveTo(x,0);c.bezierCurveTo(x+6,150,x-4,350,x+2,512);c.stroke();}
      c.fillStyle='#79664d55';c.fillRect(i*64,0,1.2,512);c.fillRect(i*64,(i%3)*171,64,1);
    }
  } else {
    c.fillStyle=kind==='fabric'?'#e7e1d0':'#dbd9cd';c.fillRect(0,0,512,512);
    for(let i=0;i<26000;i++){let t=rand()>.5?'255,255,255':'61,58,44';c.fillStyle=`rgba(${t},${rand()*.13})`;c.fillRect(rand()*512,rand()*512,kind==='fabric'?1:2,kind==='fabric'?4:2);}
    if(kind==='tile'){c.strokeStyle='#bcbeb3';c.lineWidth=2;c.strokeRect(0,0,512,512);}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}
const oakTex=texture('oak'), fabricTex=texture('fabric'), stoneTex=texture('stone'), tileTex=texture('tile');
const M={wall:material('#ece9df'),trim:material('#f5f2e7'),oak:material('#cbb18c',.65,{map:oakTex}),darkOak:material('#806044',.7,{map:oakTex}),stone:material('#e4e1d4',.8,{map:stoneTex}),tile:material('#cdcec2',.65,{map:tileTex}),linen:material('#eee7d8',.95,{map:fabricTex}),sage:material('#829071',.95,{map:fabricTex}),clay:material('#ad785d',.9,{map:fabricTex}),dark:material('#303d35',.6),brass:material('#a68a54',.3,{metalness:.7}),white:material('#f7f5e9',.26),metal:material('#9caaa9',.25,{metalness:.8}),glass:material('#d6e6dc',.12,{transparent:true,opacity:.16,metalness:.1,depthWrite:false}),mirror:material('#a5c0bb',.06,{metalness:1}),leaf:material('#465d33',.8),soil:material('#493c2a')};
function mesh(geometry,mat,x,y,z,parent=scene) {const o=new THREE.Mesh(geometry,mat);o.position.set(X(x),y,Z(z));o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(x,z,w,d,h,y,mat=M.oak,round=0,parent=scene) {
  return mesh(round?new RoundedBoxGeometry(w*SCALE,h,d*SCALE,2,Math.min(round,h/3,w*SCALE/3,d*SCALE/3)):new THREE.BoxGeometry(w*SCALE,h,d*SCALE),mat,x,y+h/2,z,parent);
}
function cyl(x,z,r,h,y,mat=M.oak,rTop=r,parent=scene) {return mesh(new THREE.CylinderGeometry(rTop*SCALE,r*SCALE,h,32),mat,x,y+h/2,z,parent);}
function ball(x,z,y,sx,sy,sz,mat) {const o=mesh(new THREE.SphereGeometry(1,20,12),mat,x,y,z);o.scale.set(sx,sy,sz);return o;}
function solid(x,z,w,d) {colliders.push([X(x-w/2),Z(z-d/2),X(x+w/2),Z(z+d/2)]);}
function floor(poly,mat,y=0) {
  const shape=new THREE.Shape(poly.map(([x,z])=>new THREE.Vector2(X(x),-Z(z))));
  const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/3,pos.getZ(i)/3);
  const o=new THREE.Mesh(geo,mat);o.position.y=y;o.receiveShadow=true;scene.add(o);return o;
}
floor(outline,M.oak);
for(const r of rooms)floor(r.poly,M[r.floor],.006);
// The slab follows the actual stepped footprint, including entrance and utility areas.
const slabShape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(X(x),-Z(z))));
const slabGeo=new THREE.ExtrudeGeometry(slabShape,{depth:.22,bevelEnabled:false});slabGeo.rotateX(-Math.PI/2);
const slab=new THREE.Mesh(slabGeo,M.trim);slab.position.y=-.23;slab.receiveShadow=true;slab.castShadow=true;scene.add(slab);
const ground=mesh(new THREE.PlaneGeometry(200,200),material('#e8e7df'),850,-.25,650);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
const ceiling=floor(outline,material('#f3eee0',.95,{side:THREE.DoubleSide}),2.8);ceiling.visible=false;ceiling.castShadow=true;
// A quiet garden beyond the glazing supplies depth during the walk.
const garden=new THREE.Group();scene.add(garden);garden.visible=false;
for(const [x,z,s] of [[480,60,1],[690,115,.85],[1000,55,1.2],[1320,90,1],[1600,210,1.2],[1600,580,.9]]) {
  mesh(new THREE.CylinderGeometry(.07*s,.11*s,2.4*s,8),M.darkOak,x,1.2*s,z,garden);
  for(let i=0;i<3;i++) {
    const crown=mesh(new THREE.IcosahedronGeometry(1,2),material(['#748568','#829475','#63795e'][i]),x+(i-1)*32*s,(2.4+i*.36)*s,z+(i%2)*24,garden);
    crown.scale.set(.8*s,1.05*s,.8*s);
  }
}
for(const [x1,z1,x2,z2,t=12] of walls) {
  const w=Math.abs(x2-x1)+t,d=Math.abs(z2-z1)+t,x=(x1+x2)/2,z=(z1+z2)/2;
  box(x,z,w,d,2.8,0,M.wall,0,architecture);solid(x,z,w,d);
  box(x,z,w+1,d+1,.065,.01,M.trim);
}
for(const [x1,z1,x2,z2] of doors) {
  const horizontal=z1===z2,x=(x1+x2)/2,z=(z1+z2)/2;
  box(x,z,horizontal?x2-x1:12,horizontal?12:z2-z1,.55,2.25,M.wall,0,overhead);
  for(const [a,b] of [[x1,z1],[x2,z2]])box(a,b, horizontal?3:15,horizontal?15:3,2.25,0,M.oak,0,glazing);
}
for(const [x1,z1,x2,z2] of windows) {
  const horizontal=z1===z2,w=horizontal?x2-x1:8,d=horizontal?8:z2-z1,x=(x1+x2)/2,z=(z1+z2)/2;
  // Low solid sill remains in the cutaway; glazing and frames appear at full height.
  box(x,z,w,d,.48,0,M.wall);solid(x,z,w,d);
  box(x,z,w,d, .55,2.25,M.wall,0,overhead);
  box(x,z,horizontal?w:2,horizontal?2:d,1.72,.5,M.glass,0,glazing);
  for(const y of [.5,2.22])box(x,z,w,d,.035,y,M.dark,0,glazing);
  const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/78);
  for(let i=0;i<=n;i++)box(x1+(x2-x1)*i/n,z1+(z2-z1)*i/n,3,3,1.76,.48,M.dark,0,glazing);
  if(z1===270) {
    for(const px of [x1+10,x2-10])for(let i=0;i<5;i++)cyl(px+i*2.2,278,2,2.22,.12,M.linen,2,glazing);
  }
}
// Structural columns visible in the drawing.
for(const [x,z,w,d] of [[490,235,70,70],[1420,235,70,70],[1410,905,90,60],[515,905,105,70],[940,963,75,55]]) {
  box(x,z,w,d,2.8,0,M.wall,0,architecture);solid(x,z,w,d);
}

function rug(x,z,w,d,mat=M.linen) {
  box(x,z,w,d,.018,.014,mat,.007);
  for(let i=0;i<Math.floor(w/5);i++)for(const side of [-1,1])box(x-w/2+i*5,z+side*(d/2+2),.6,4,.006,.017,mat);
}
function cabinet(x,z,w,d,h=2.15,mat=M.oak,front='south') {
  box(x,z,w,d,h,.04,mat,.015);solid(x,z,w,d);
  const n=Math.max(1,Math.round((front==='west'||front==='east'?d:w)/43));
  for(let i=0;i<n;i++) {
    const side=front==='east'?1:-1;
    if(front==='west'||front==='east') {
      box(x+side*(w/2+.5),z-d/2+(i+.5)*d/n,1,d/n-1.2,h-.09,.09,mat);
      box(x+side*(w/2+1.4),z-d/2+(i+.7)*d/n,1,1,.23,Math.min(1,h*.65),M.brass);
    } else {
      const facing=front==='north'?-1:1;
      box(x-w/2+(i+.5)*w/n,z+facing*(d/2+.5),w/n-1.2,1,h-.09,.09,mat);
      box(x-w/2+(i+.8)*w/n,z+facing*(d/2+1.4),1,1,.23,Math.min(1,h*.65),M.brass);
    }
  }
}
function plant(x,z,size=1) {
  cyl(x,z,13*size,.31*size,.02,M.stone,17*size);cyl(x,z,14*size,.02,.32*size,M.soil);
  for(let i=0;i<9;i++) {
    const a=i*2.4,h=(.5+(i%4)*.2)*size,dx=Math.cos(a)*19*size,dz=Math.sin(a)*19*size;
    const stem=mesh(new THREE.CylinderGeometry(.007,.01,h,5),M.leaf,x+dx/2,.32*size+h/2,z+dz/2);stem.rotation.z=-dx*SCALE/h;stem.rotation.x=dz*SCALE/h;
    const leaf=ball(x+dx,z+dz,.32*size+h,.085*size,.21*size,.034*size,M.leaf);leaf.rotation.set(.4,a,.45);
  }
}
function lamp(x,z,y=0) {
  cyl(x,z,10,.03,y,M.brass);cyl(x,z,1,.40,y+.03,M.brass);
  cyl(x,z,16,.25,y+.35,M.linen,10);cyl(x,z,11,.015,y+.355,material('#fff1d4',.8,{emissive:'#ffd294',emissiveIntensity:.7}));
}
function book(x,z,w=15,d=20,y=.5,color=M.sage) {box(x,z,w,d,.035,y,color);box(x,z,w-.5,d-1,.021,y+.007,M.linen);}
function vase(x,z,y=.5){cyl(x,z,6,.19,y,M.clay,3);for(let i=0;i<3;i++){const o=box(x+i*2,z, .5,.5,.3,y+.17,M.leaf);o.rotation.z=(i-1)*.14;}}
function chair(x,z,angle=0,mat=M.linen) {
  const group=new THREE.Group();scene.add(group);
  const parts=[];
  parts.push(box(x,z,36,36,.095,.43,mat,.045));
  parts.push(box(x,z+15,36,5,.36,.49,mat,.035));
  for(const dx of [-13,13])for(const dz of [-13,13])parts.push(box(x+dx,z+dz,2.5,2.5,.43,0,M.darkOak));
  group.position.set(X(x),0,Z(z));for(const o of parts)group.attach(o);group.rotation.y=angle;solid(x,z,32,32);
}
function desk(x,z,w=45,d=95) {
  box(x,z,w,d,.06,.75,M.oak,.02);solid(x,z,w,d);
  for(const dx of [-w/2+4,w/2-4])for(const dz of [-d/2+4,d/2-4])box(x+dx,z+dz,3,3,.75,0,M.darkOak);
  box(x,z-10,2,36,.27,.81,M.dark,.012);box(x-1.2,z-10,1,32,.22,.835,material('#8da09c',.45,{emissive:'#728e8f',emissiveIntensity:.15}));
  box(x-12,z-10,10,24,.018,.816,M.metal,.007);book(x,z+d/2-14,17,23,.82);lamp(x,z-d/2+14,.81);
}
function bed(x,z,length,width,mat=M.sage) {
  rug(x-7,z,length+34,width+42);
  box(x,z,length,width,.25,.09,M.oak,.04);solid(x,z,length,width);
  box(x+length/2-3,z,8,width+9,.92,.08,M.linen,.065);
  box(x-1,z,length-5,width-4,.23,.34,M.linen,.07);
  box(x-20,z,length-44,width-3,.09,.57,mat,.035);
  box(x-45,z,32,width-1,.035,.65,M.linen,.016);
  const count=width>120?2:1;
  for(let i=0;i<count;i++) {const p=box(x+length/2-30,z+(i-(count-1)/2)*(width/2),36,width/count-13,.13,.58,M.linen,.06);p.rotation.y=.04*(i?1:-1);}
}
// Living and dining: sofa against the bedroom partition, media wall opposite.
rug(682,425,212,246);
cabinet(545,426,30,232,.42,M.oak,'east');
box(532,415,3,139,.87,.72,M.dark,.015);box(534,415,1,130,.78,.765,material('#253132',.22,{metalness:.3}));
box(778,401,74,212,.24,.12,M.darkOak,.06);solid(778,401,74,212);
box(806,401,14,222,.69,.29,M.linen,.07);
for(const z of [299,503])box(775,z,71,13,.49,.25,M.linen,.06);
for(const z of [337,401,465]){box(774,z,60,62,.23,.35,M.linen,.06);const o=box(795,z,14,53,.38,.57,M.linen,.065);o.rotation.z=-.13;}
for(const [z,mat] of [[320,M.sage],[470,M.clay]]){const o=box(780,z,25,31,.15,.63,mat,.05);o.rotation.set(.15,.18,.4);}
box(695,333,69,69,.11,.32,M.stone,.055);box(695,333,40,40,.32,0,M.darkOak,.02);solid(695,333,69,69);
book(685,330,22,26,.44);vase(711,345,.44);
cyl(673,455,28,.055,.36,M.darkOak);cyl(673,455,9,.36,0,M.darkOak);solid(673,455,56,56);book(665,450,19,25,.42,M.clay);
cyl(777,539,24,.05,.49,M.oak);cyl(777,539,7,.49,0,M.oak);lamp(777,539,.54);
plant(553,598,1.35);plant(559,302,.7);
box(731,720,123,72,.075,.74,M.oak,.03);solid(731,720,123,72);
for(const x of [689,773])for(const z of [699,741])box(x,z,5,5,.74,0,M.darkOak);
for(const x of [695,766]){chair(x,675,Math.PI);chair(x,767);}
vase(729,720,.82);book(757,722,17,23,.82);
// Foyer, continuous kitchen counter, refrigerator and cooking details.
cabinet(370,906,162,31,2.76,M.oak,'north');box(370,906,162,31,.04,0,M.oak);
plant(480,782,.8);rug(367,814,130,88,M.sage);
cabinet(670,895,72,60,.89,M.oak,'north');cabinet(797,895,38,60,2.2,M.oak,'north');
box(740,895,61,60,1.98,0,M.metal,.025);solid(740,895,61,60);
box(740,864,59,1,1.32,.64,M.white,.01);box(740,864,59,1,.59,.03,M.white,.01);box(763,862,2,2,.40,.93,M.metal);
cabinet(928,782,45,243,.85,M.oak,'west');box(928,782,49,246,.055,.89,M.stone,.012);
// Inset sink assembled as a rim and basin, not a solid block on the counter.
box(927,710,31,48,.012,.95,M.metal,.01);box(927,710,25,40,.013,.956,M.dark,.016);box(927,710,21,36,.014,.96,M.metal,.02);
const faucet=new THREE.Mesh(new THREE.TorusGeometry(.115,.012,8,24,Math.PI),M.metal);faucet.position.set(X(942),1.12,Z(710));faucet.rotation.y=Math.PI/2;scene.add(faucet);box(942,720,2,2,.17,.95,M.metal);
box(927,881,33,55,.025,.95,M.dark,.01);
for(const z of [867,895]){const ring=mesh(new THREE.TorusGeometry(.087,.008,8,24),M.metal,927,.983,z);ring.rotation.x=Math.PI/2;cyl(927,z,4,.01,.98,M.dark);}
cyl(926,867,8,.10,.99,M.metal);box(938,867,12,2,.025,1.04,M.dark);
box(928,881,45,61,.15,1.87,M.metal,.015);box(943,881,12,26,.74,2.02,M.wall,0,overhead);
cabinet(994,710,33,120,2.25,M.oak,'east');cabinet(994,819,33,90,2.25,M.oak,'east');
book(926,757,22,29,.95);vase(928,790,.95);
// Bedrooms and study retain the furniture orientation in the supplied plan.
bed(987,375,160,89,M.clay);cabinet(990,524,150,42,2.2,M.oak,'north');desk(1052,454,34,59);chair(1008,453,-Math.PI/2);
cyl(1050,309,18,.48,0,M.oak);lamp(1050,309,.48);
bed(1288,451,161,163,M.sage);cabinet(1112,402,43,241,2.3,M.oak,'east');
for(const z of [341,557]){cyl(1360,z,20,.46,0,M.oak);lamp(1360,z,.46);}
plant(1157,301,.8);
desk(1200,792,42,135);chair(1157,797,-Math.PI/2);cabinet(1198,708,43,99,2.15,M.oak,'west');
// Open shelves and books make the study readable from both camera modes.
for(let j=0;j<3;j++){box(1185,700,16,65,.035,.75+j*.39,M.darkOak);for(let i=0;i<7;i++)box(1179,675+i*7,12,4,.19+(i%3)*.035,.79+j*.39,[M.sage,M.clay,M.linen][i%3]);}
function toilet(x,z,angle=0) {
  const group=new THREE.Group();scene.add(group);group.position.set(X(x),0,Z(z));const parts=[];
  parts.push(box(x,z+16,28,13,.72,0,M.white,.045));parts.push(ball(x,z,.25,.13,.24,.19,M.white));
  parts.push(ball(x,z-3,.44,.17,.065,.24,M.white));parts.push(ball(x,z-4,.491,.12,.012,.175,M.dark));parts.push(ball(x,z-4,.5,.087,.012,.138,M.white));
  for(const o of parts)group.attach(o);group.rotation.y=angle;solid(x,z,33,48);
}
function vanity(x,z,w,d,front='south') {
  cabinet(x,z,w,d,.73,M.oak,front);box(x,z,w+2,d+2,.045,.78,M.stone,.018);
  box(x,z,w-9,d-8,.10,.82,M.white,.04);box(x,z,w-17,d-15,.011,.92,M.metal,.018);
  cyl(x,z+d/2-5,1,.18,.84,M.metal);
  if(front==='east')box(x-w/2+2,z,2,d,.85,1.13,M.mirror,.01);
  else box(x,z+d/2-1,w,2,.85,1.13,M.mirror,.01);
}
vanity(1251,706,32,66,'east');toilet(1272,792,-Math.PI/2);
// Extruding a shape with a hole gives the tub a real basin and rounded rim.
const tubShape=new THREE.Shape();tubShape.absellipse(0,0,.30,.56,0,Math.PI*2,false);
const tubHole=new THREE.Path();tubHole.absellipse(0,0,.245,.49,0,Math.PI*2,true);tubShape.holes.push(tubHole);
const tubGeo=new THREE.ExtrudeGeometry(tubShape,{depth:.43,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:3,steps:1});tubGeo.rotateX(-Math.PI/2);
mesh(tubGeo,M.white,1393,.06,710);solid(1393,710,58,103);
const tubBottom=cyl(1393,710,21,.07,.05,M.white);tubBottom.scale.z=2;
const water=mesh(new THREE.CircleGeometry(1,48),material('#b6d1ca',.13,{metalness:.15}),1393,.24,710);water.rotation.x=-Math.PI/2;water.scale.set(.242,.486,1);water.castShadow=false;
box(1393,660,2,2,.65,0,M.metal);box(1388,660,11,2,.025,.64,M.metal);
box(1399,822,66,77,.025,.018,M.tile);box(1364,821,1,83,1.95,.04,M.glass,0,glazing);
box(1428,819,2,2,1.85,.2,M.metal);box(1418,819,20,2,.025,2.05,M.metal);cyl(1410,819,8,.025,2.02,M.metal);
cabinet(1289,855,116,22,.5);box(1289,855,110,19,.03,.55,M.linen,.015);
vanity(514,1062,67,39);toilet(594,1056);box(425,1007,74,133,.022,.02,M.tile);
box(466,1020,1,133,1.95,.04,M.glass,0,glazing);box(394,974,2,2,1.8,.25,M.metal);cyl(404,974,9,.035,2.02,M.metal);
// Utility balcony: laundry, deep sink and external condenser.
box(678,1050,48,55,.87,0,M.white,.025);solid(678,1050,48,55);
const washer=mesh(new THREE.CylinderGeometry(.2,.2,.04,32),M.dark,678,.45,1079);washer.rotation.x=Math.PI/2;
const drum=mesh(new THREE.CylinderGeometry(.155,.155,.045,32),M.glass,678,.45,1081);drum.rotation.x=Math.PI/2;
box(678,1079,42,1,.085,.74,M.metal);vanity(677,976,43,52,'east');
box(939,1044,40,62,.72,0,M.white,.018);for(let i=0;i<10;i++)box(918,1021+i*5,1,2,.45,.14,M.metal);
// Wall art, slender frame, restrained abstract composition.
function art(x,z,w,h,rot=0) {
  const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d');ctx.fillStyle='#e8dfcc';ctx.fillRect(0,0,256,320);ctx.fillStyle='#829078';ctx.beginPath();ctx.arc(128,125,82,Math.PI,0);ctx.lineTo(210,260);ctx.lineTo(46,260);ctx.fill();ctx.fillStyle='#bc8a66';ctx.beginPath();ctx.arc(160,196,56,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ece6d8';ctx.fillRect(0,240,125,80);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const group=new THREE.Group();group.position.set(X(x),1.6,Z(z));group.rotation.y=rot;scene.add(group);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(w*SCALE,h,.035),M.darkOak);group.add(frame);
  const pic=new THREE.Mesh(new THREE.PlaneGeometry(w*SCALE-.04,h-.04),material('#ffffff',.9,{map:tex}));pic.position.z=.02;group.add(pic);
  glazing.add(group);
}
art(1072,375,54,.9,-Math.PI/2);art(1210,632,62,1,Math.PI);art(812,401,75,.85,-Math.PI/2);art(349,764,49,.65);
const warmLights=[];
for(const [x,z] of [[692,424],[733,720],[985,407],[1250,442],[1100,764],[856,805],[1305,747],[507,982],[770,1010],[396,820]]) {
  const light=new THREE.PointLight('#ffca88',0,5,2);light.position.set(X(x),2.45,Z(z));scene.add(light);warmLights.push(light);
  cyl(x,z,13,.04,2.72,material('#f4e8cf',.5,{emissive:'#ffd598',emissiveIntensity:.5}),13,overhead);
}
// A linen pendant over the dining table.
cyl(731,720,.7,.53,2.12,M.dark,.7,overhead);cyl(731,720,28,.26,1.94,M.linen,12,overhead);

let mode='overview',fullWalls=false,evening=false,yaw=0,pitch=0,currentRoom='',drag=null,lastTime=0;
const keys=new Set();
function canStand(x,z) {
  const px=x/SCALE+850,pz=z/SCALE+650,r=.18;
  if(!inside(px,pz))return false;
  // ponytail: linear scan is ample for this single apartment; use a spatial index for large buildings.
  return !colliders.some(([x1,z1,x2,z2])=>x>x1-r&&x<x2+r&&z>z1-r&&z<z2+r);
}
function wallState() {
  const full=mode==='walk'||fullWalls;
  architecture.scale.y=full?1:.29;glazing.visible=full;overhead.visible=full;ceiling.visible=mode==='walk';garden.visible=mode==='walk';
  $('#walls').setAttribute('aria-pressed',String(full));$('#walls').disabled=mode==='walk';
  $('#walls span').textContent=full?'Cutaway':'Full walls';
}
function resetView() {
  orbit.target.set(.1,0,.2);
  camera.position.set(-11.3,15.8,18.7);
  if(innerWidth<801)camera.position.multiplyScalar(Math.max(1.3,.9/camera.aspect));
  camera.fov=39;camera.updateProjectionMatrix();orbit.update();
}
function setMode(next,room=rooms[0]) {
  keys.clear();drag=null;
  if(document.pointerLockElement)document.exitPointerLock();
  mode=next;document.body.classList.toggle('walking',mode==='walk');orbit.enabled=mode==='overview';
  for(const id of ['overview','walk']){$('#'+id).classList.toggle('active',mode===id);$('#'+id).setAttribute('aria-pressed',String(mode===id));}
  wallState();
  if(mode==='overview'){resetView();$('#hint').innerHTML='Drag to orbit <i>·</i> Scroll to zoom';currentRoom='';updateRoom();}
  else {
    camera.fov=67;camera.updateProjectionMatrix();camera.position.set(X(room.point[0]),1.62,Z(room.point[1]));
    yaw=Math.atan2(-(room.look[0]-room.point[0]),-(room.look[1]-room.point[1]));pitch=['bath','guest','utility','kitchen'].includes(room.id)?-.48:-.2;
    look();updateRoom();$('#hint').textContent=matchMedia('(pointer:coarse)').matches?'Drag to look · Arrow pad to move':'WASD / arrows to move · Drag to look · Esc releases mouse';
  }
  renderer.domElement.tabIndex=-1;renderer.domElement.focus({preventScroll:true});
}
function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
const ns='http://www.w3.org/2000/svg';
for(const [i,r] of rooms.entries()) {
  const b=document.createElement('button');b.dataset.room=r.id;b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><span>${r.name}</span><span class="arrow">↗</span>`;b.addEventListener('click',()=>setMode('walk',r));$('#rooms').append(b);
  const poly=document.createElementNS(ns,'polygon');poly.setAttribute('points',r.poly.map(p=>p.join(',')).join(' '));poly.setAttribute('class','room');poly.dataset.room=r.id;$('#minimap').append(poly);
}
for(const [x1,z1,x2,z2] of walls){const line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1,y1:z1,x2,y2:z2,class:'wall'}))line.setAttribute(k,v);$('#minimap').append(line);}
const marker=document.createElementNS(ns,'path');marker.setAttribute('d','M 0 -23 L 16 15 L 0 9 L -16 15 Z');marker.setAttribute('class','marker');$('#minimap').append(marker);
function updateRoom(){
  const px=camera.position.x/SCALE+850,pz=camera.position.z/SCALE+650;
  const room=mode==='walk'?rooms.find(r=>inside(px,pz,r.poly)):null;
  const id=room?.id||'';
  if(id!==currentRoom||mode==='overview') {
    currentRoom=id;$('#room-name').textContent=room?.name||'Hallway';$('#location').textContent=mode==='walk'?(room?.name||'Hallway'):'The whole residence';
    for(const b of $('#rooms').children){b.classList.toggle('active',b.dataset.room===id);b.setAttribute('aria-current',b.dataset.room===id?'location':'false');}
    for(const p of $('#minimap').querySelectorAll('.room'))p.classList.toggle('selected',p.dataset.room===id);
  }
  marker.style.display=mode==='walk'?'':'none';marker.setAttribute('transform',`translate(${px} ${pz}) rotate(${-yaw*180/Math.PI})`);$('#map-mode').textContent=mode==='walk'?'WALKING':'OVERVIEW';
}
$('#overview').onclick=()=>setMode('overview');$('#walk').onclick=()=>setMode('walk');
$('#reset').onclick=()=>setMode(mode);
$('#walls').onclick=()=>{fullWalls=!fullWalls;wallState();};
$('#light').onclick=()=>{
  evening=!evening;$('#light').setAttribute('aria-pressed',String(evening));$('#light span').textContent=evening?'Evening':'Daylight';
  sun.intensity=evening?.15:3.5;hemi.intensity=evening?.55:2.1;fill.intensity=evening?.25:1;scene.environmentIntensity=evening?.18:.32;
  for(const l of warmLights)l.intensity=evening?15:0;
  scene.background.set(evening?'#c5c8bf':'#edece5');
};
function showDialog(id){keys.clear();if(document.pointerLockElement)document.exitPointerLock();$(id).showModal();}
$('#source').onclick=()=>showDialog('#plan-dialog');$('#help').onclick=()=>showDialog('#help-dialog');
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
const movement={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(mode!=='walk'||document.querySelector('dialog[open]')||e.target.matches('button,a,input'))return;if(movement[e.code]){e.preventDefault();keys.add(movement[e.code]);}});
addEventListener('keyup',e=>{if(movement[e.code])keys.delete(movement[e.code]);});
addEventListener('blur',()=>{keys.clear();drag=null;});
document.addEventListener('visibilitychange',()=>{keys.clear();drag=null;});
renderer.domElement.addEventListener('pointerdown',e=>{if(mode==='walk'&&!document.pointerLockElement){drag={x:e.clientX,y:e.clientY,total:0,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{
  if(mode!=='walk')return;
  let dx=0,dy=0;
  if(document.pointerLockElement){dx=e.movementX;dy=e.movementY;}
  else if(drag){dx=e.clientX-drag.x;dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.total+=Math.abs(dx)+Math.abs(dy);}
  else return;
  yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.25,1.25);look();
});
renderer.domElement.addEventListener('pointerup',e=>{
  if(drag&&drag.total<4&&e.pointerType==='mouse')renderer.domElement.requestPointerLock?.()?.catch(()=>{});
  drag=null;
});
renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
for(const b of document.querySelectorAll('[data-move]')) {
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.move);b.setPointerCapture(e.pointerId);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);
function move(dt) {
  let forward=Number(keys.has('forward'))-Number(keys.has('back')),side=Number(keys.has('right'))-Number(keys.has('left'));
  const length=Math.hypot(forward,side);if(!length)return;
  const speed=1.7*dt/length,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  // Small substeps prevent skipping a narrow wall after a slow frame.
  const steps=Math.ceil(Math.hypot(dx,dz)/.06);
  for(let i=0;i<steps;i++){if(canStand(camera.position.x+dx/steps,camera.position.z))camera.position.x+=dx/steps;if(canStand(camera.position.x,camera.position.z+dz/steps))camera.position.z+=dz/steps;}
}
setMode('overview');
renderer.setAnimationLoop(time=>{
  const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  if(mode==='overview')orbit.update();else if(!document.querySelector('dialog[open]')){move(dt);updateRoom();}
  renderer.render(scene,camera);
});
renderer.render(scene,camera);$('#loading').classList.add('done');
// Small read-only diagnostics also let the browser check movement against actual rendered geometry.
window.apartment={get mode(){return mode;},get position(){return {x:camera.position.x,z:camera.position.z};},get room(){return currentRoom;},get meshes(){return renderer.info.render.calls;},canStand,rooms,colliders,revision:THREE.REVISION};
