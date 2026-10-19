import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SCALE, X, Z, CEILING, outline, rooms, walls, windows, doors, inside, fitsFurniture } from './plan.js';
import { wallCorners, cornerSpan } from './wall-edges.js';
import { createStool } from './stool.js';
import { createStool2 } from './stool2.js';

const $ = s => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#edece5');
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$('#viewport').append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','3D apartment. Choose Edit furniture to move chairs and tables. Drag elsewhere to orbit; choose Walk inside for keyboard movement.');
const camera = new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.05,150);
const orbit = new OrbitControls(camera,renderer.domElement);
orbit.enableDamping = true;
orbit.minDistance=7; orbit.maxDistance=65;
orbit.maxPolarAngle=Math.PI*.47;
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmrem.fromScene(environment,.04).texture;
scene.environmentIntensity=.22;
environment.dispose(); pmrem.dispose();
// Hemisphere light stands in for window daylight; area lights and AO are too slow for embedded GPUs.
const hemi = new THREE.HemisphereLight('#ffe3bb','#c7ad86',1.4); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe2b4',3.5); sun.position.set(-5,12,-9); scene.add(sun);
sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:40});
sun.shadow.normalBias=.02; sun.shadow.bias=-.0001; sun.shadow.radius=3; sun.shadow.blurSamples=8;
const fill = new THREE.DirectionalLight('#f2dcbc',1); fill.position.set(7,8,9); scene.add(fill);
const architecture = new THREE.Group(), glazing = new THREE.Group(), overhead = new THREE.Group();
scene.add(architecture,glazing,overhead);
const colliders=[];
function material(color,roughness=.75,other={}){return new THREE.MeshStandardMaterial({color,roughness,...other});}
function texture(kind) {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
  const c=canvas.getContext('2d');
  let seed=42; const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  if(kind==='oak'||kind==='floor') {
    const light=kind==='floor';
    c.fillStyle=light?'#c7b293':'#bba17b'; c.fillRect(0,0,512,512);
    for(let i=0;i<8;i++) {
      c.fillStyle=light?`hsl(36 30% ${66+rand()*7}%)`:`hsl(34 29% ${61+rand()*10}%)`; c.fillRect(i*64,0,63,512);
      for(let j=0;j<160;j++) {c.strokeStyle=`rgba(82,55,26,${rand()*(light?.07:.12)})`;c.lineWidth=.3+rand();c.beginPath();const x=i*64+rand()*62;c.moveTo(x,0);c.bezierCurveTo(x+6,150,x-4,350,x+2,512);c.stroke();}
      c.fillStyle='#79664d55';c.fillRect(i*64,0,1.2,512);c.fillRect(i*64,(i%3)*171,64,1);
    }
  } else if(kind==='travertine') {
    // Large honed travertine tiles, as in the entrance renderings.
    c.fillStyle='#e0d3bd';c.fillRect(0,0,512,512);
    for(let i=0;i<90;i++){c.strokeStyle=`rgba(${rand()>.5?'255,250,240':'150,125,95'},${rand()*.07})`;c.lineWidth=2+rand()*10;c.beginPath();const y=rand()*512;c.moveTo(0,y);c.bezierCurveTo(170,y+rand()*30-15,340,y+rand()*30-15,512,y+rand()*20-10);c.stroke();}
    for(let i=0;i<9000;i++){c.fillStyle=`rgba(120,95,70,${rand()*.08})`;c.fillRect(rand()*512,rand()*512,1+rand()*2,1);}
    c.fillStyle='#c4b49a';c.fillRect(0,0,512,1.5);c.fillRect(0,256,512,1.5);c.fillRect(0,0,1.5,512);
  } else if(kind==='pleat') {
    c.fillStyle='#e4e1da';c.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=8){c.fillStyle='rgba(120,115,105,.28)';c.fillRect(0,y,512,1.5);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(0,y+3,512,2);}
  } else {
    c.fillStyle=kind==='fabric'?'#e7e1d0':'#dbd9cd';c.fillRect(0,0,512,512);
    for(let i=0;i<26000;i++){let t=rand()>.5?'255,255,255':'61,58,44';c.fillStyle=`rgba(${t},${rand()*.13})`;c.fillRect(rand()*512,rand()*512,kind==='fabric'?1:2,kind==='fabric'?4:2);}
    if(kind==='tile'){c.strokeStyle='#bcbeb3';c.lineWidth=2;c.strokeRect(0,0,512,512);}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}
const floorTex=texture('floor'),travertineTex=texture('travertine'),pleatTex=texture('pleat');
const oakTex=texture('oak'), fabricTex=texture('fabric'), stoneTex=texture('stone'), tileTex=texture('tile');
const M={wall:material('#e9e1d3'),trim:material('#f5f2e7'),oak:material('#cbb18c',.65,{map:oakTex}),darkOak:material('#806044',.7,{map:oakTex}),stone:material('#ada595',.7,{map:travertineTex}),tile:material('#cdcec2',.65,{map:tileTex}),linen:material('#eee7d8',.95,{map:fabricTex}),sage:material('#829071',.95,{map:fabricTex}),clay:material('#ad785d',.9,{map:fabricTex}),dark:material('#303d35',.6),brass:material('#a68a54',.3,{metalness:.7}),white:material('#f7f5e9',.26),metal:material('#9caaa9',.25,{metalness:.8}),glass:material('#d6e6dc',.12,{transparent:true,opacity:.16,metalness:.1,depthWrite:false}),mirror:material('#a5c0bb',.06,{metalness:1}),leaf:material('#465d33',.8),soil:material('#493c2a')};
const wallEdgeMaterial=new THREE.LineBasicMaterial({color:'#68685f',toneMapped:false,depthWrite:false});
M.frame=material('#3b3026',.45,{metalness:.35});
M.floor=material('#e2d0b4',.6,{map:floorTex});
// Finishes sampled from the designer renderings (assets/tex-*.jpg); mirrored repeat hides crop seams.
const loader=new THREE.TextureLoader();
function photo(name,tile,color='#ffffff',roughness=.7) {
  const map=loader.load(`assets/tex-${name}.jpg`,()=>requestRender());
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.MirroredRepeatWrapping;map.anisotropy=8;
  const m=material(color,roughness,{map});m.userData.tile=tile;return m;
}
Object.assign(M,{
  whiteOak:photo('whiteoak',[.5,2],'#ffffff',.75),walnut:photo('walnut',[.55,.5],'#c8d4e2',.55),
  veneer:photo('kitchen-stone',[1.2,.67],'#ffffff',.6),lightOak:material('#e9cfa6',.6,{map:oakTex}),
  paint:material('#ece5d8',.85),lacquer:material('#f1eee8',.5),taupe:material('#b4a693',.55),quartz:material('#e6dccb',.35),
  reveal:material('#5d554b',.9),boucle:material('#e9e4db',1,{map:fabricTex}),sofa:material('#adadaa',1,{map:fabricTex}),
  black:material('#262524',.45,{metalness:.5}),screen:material('#151719',.18,{metalness:.2}),charcoal:material('#3b3936',.6),
  steel:material('#c9c9c6',.25,{metalness:.9}),blind:material('#dedbd5',.95,{map:pleatTex,side:THREE.DoubleSide}),
  led:new THREE.MeshBasicMaterial({color:'#fff3dc'}),boucleShell:material('#e9e4db',1,{map:fabricTex,side:THREE.DoubleSide}),fridgeGap:material('#c4c0b9',.6),soffit:material('#e0d6c4',.9),
});
M.blind.userData.tile=[1,1];
M.entryDoor=material('#39251d',.65,{map:oakTex});
Object.assign(M.wall,{polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
function mesh(geometry,mat,x,y,z,parent=scene) {const o=new THREE.Mesh(geometry,mat);o.position.set(X(x),y,Z(z));o.castShadow=!mat.transparent;o.receiveShadow=true;parent.add(o);return o;}
// Metre-based UVs keep sampled grain at real scale on every face.
function worldUV(geo,[tu,tv]) {
  const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++) {
    const [a,b]=Math.abs(n.getY(i))>.5?[p.getX(i),p.getZ(i)]:Math.abs(n.getX(i))>.5?[p.getZ(i),p.getY(i)]:[p.getX(i),p.getY(i)];
    uv.setXY(i,a/tu+.5,b/tv+.5);
  }
  return geo;
}
function box(x,z,w,d,h,y,mat=M.oak,round=0,parent=scene) {
  const geo=round?new RoundedBoxGeometry(w*SCALE,h,d*SCALE,2,Math.min(round,h/3,w*SCALE/3,d*SCALE/3)):new THREE.BoxGeometry(w*SCALE,h,d*SCALE);
  const tile=[mat].flat().find(m=>m.userData.tile)?.userData.tile;if(tile)worldUV(geo,tile);
  return mesh(geo,mat,x,y+h/2,z,parent);
}
function cyl(x,z,r,h,y,mat=M.oak,rTop=r,parent=scene) {return mesh(new THREE.CylinderGeometry(rTop*SCALE,r*SCALE,h,32),mat,x,y+h/2,z,parent);}
function ball(x,z,y,sx,sy,sz,mat) {const o=mesh(new THREE.SphereGeometry(1,20,12),mat,x,y,z);o.scale.set(sx,sy,sz);return o;}
function solid(x,z,w,d) {colliders.push([X(x-w/2),Z(z-d/2),X(x+w/2),Z(z+d/2)]);}
function floor(poly,mat,y=0) {
  const shape=new THREE.Shape(poly.map(([x,z])=>new THREE.Vector2(X(x),-Z(z))));
  const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getZ(i)/1.6,pos.getX(i)/1.6);
  const o=new THREE.Mesh(geo,mat);o.position.y=y;o.receiveShadow=true;scene.add(o);return o;
}
floor(outline,M.floor);
for(const r of rooms)if(r.floor!=='oak')floor(r.poly,M[r.floor],.006);
// The slab follows the actual stepped footprint, including entrance and utility areas.
const slabShape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(X(x),-Z(z))));
const slabGeo=new THREE.ExtrudeGeometry(slabShape,{depth:.22,bevelEnabled:false});slabGeo.rotateX(-Math.PI/2);
const slab=new THREE.Mesh(slabGeo,M.trim);slab.position.y=-.23;slab.receiveShadow=true;slab.castShadow=true;scene.add(slab);
const ground=mesh(new THREE.PlaneGeometry(200,200),material('#e8e7df'),850,-.25,650);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
const ceiling=floor(outline,material('#f3eee0',.95,{side:THREE.DoubleSide}),CEILING);ceiling.visible=false;ceiling.castShadow=true;
// A quiet garden beyond the glazing supplies depth during the walk.
const garden=new THREE.Group();scene.add(garden);garden.visible=false;
for(const [x,z,s] of [[480,60,1],[690,115,.85],[1000,55,1.2],[1320,90,1],[1600,210,1.2],[1600,580,.9]]) {
  mesh(new THREE.CylinderGeometry(.07*s,.11*s,2.4*s,8),M.darkOak,x,1.2*s,z,garden);
  for(let i=0;i<3;i++) {
    const crown=mesh(new THREE.IcosahedronGeometry(1,2),material(['#748568','#829475','#63795e'][i]),x+(i-1)*32*s,(2.4+i*.36)*s,z+(i%2)*24,garden);
    crown.scale.set(.8*s,1.05*s,.8*s);
  }
}
// Trees would shade the glazing; renderings show sunlit floor patches by the windows.
garden.traverse(o=>o.castShadow=false);
for(const [x1,z1,x2,z2,t=12] of walls) {
  const horizontal=z1===z2;
  // Wall junctions overlap, but an opening's clear span must not be covered by end caps.
  const meetsOpening=(x,z)=>[...doors,...windows].some(([a,b,c,d])=>horizontal===(b===d)&&
    ((x===a&&z===b)||(x===c&&z===d)));
  const start=meetsOpening(x1,z1)?0:t/2,end=meetsOpening(x2,z2)?0:t/2;
  const w=horizontal?x2-x1+start+end:t,d=horizontal?t:z2-z1+start+end;
  const x=(x1+x2)/2+(horizontal?(end-start)/2:0),z=(z1+z2)/2+(horizontal?0:(end-start)/2);
  box(x,z,w,d,CEILING,0,M.wall,0,architecture);solid(x,z,w,d);
  box(x,z,w+1,d+1,.065,.01,M.trim);
}
for(const [x1,z1,x2,z2,{head=2.25,style}={}] of doors) {
  const horizontal=z1===z2,x=(x1+x2)/2,z=(z1+z2)/2;
  box(x,z,horizontal?x2-x1:12,horizontal?12:z2-z1,CEILING-head,head,M.wall,0,overhead);
  const frame=style==='flush'?M.paint:style?M.frame:M.oak;
  for(const [a,b] of [[x1,z1],[x2,z2]])box(a,b,horizontal?3:15,horizontal?15:3,head,0,frame,0,glazing);
  box(x,z,horizontal?x2-x1:15,horizontal?15:z2-z1,.045,head-.045,frame,0,glazing);
  if(!style)continue;
  const leaf=new THREE.Group();leaf.name=style+'-door';glazing.add(leaf);
  if(style==='flush') {
    // Guest toilet: full-height white flush leaf (rendering 2), shown open into the terrazzo nook for walking.
    box(x,z,x2-x1-2,3,head-.01,0,M.lacquer,0,leaf);
    const hinge=new THREE.Vector3(X(x2),0,Z(z2));
    for(const part of leaf.children)part.position.sub(hinge);
    leaf.position.copy(hinge);leaf.position.x-=8*SCALE;leaf.rotation.y=Math.PI/2;
    solid(x2-8,z2+(x2-x1)/2,4,x2-x1);
  } else if(style==='entrance') {
    box(x,z,4,z2-z1-6,head-.06,.02,M.entryDoor,0,leaf);
    for(const y of [.32,.64,.96,1.28,1.60,1.92])box(x+2.1,z+5,.25,z2-z1-22,.009,y,M.frame,0,leaf);
    box(x+3,z2-11,1.5,3,.22,.87,M.metal,0,leaf);
    box(x+4,z2-15,2,10,.022,1.04,M.metal,0,leaf);
    cyl(x+2.2,z,1,.015,1.48,M.brass,1,leaf).rotation.z=Math.PI/2;
    solid(x,z,4,z2-z1);
  } else {
    // Keep the photographed glazed door open 90 degrees into the balcony for walking.
    const width=x2-x1-6;
    box(x,z,width,2,head-.12,.06,M.glass,0,leaf);
    for(const px of [x1+4,x2-4])box(px,z,4,5,head-.04,.02,M.frame,0,leaf);
    for(const y of [.03,1.02,head-.07])box(x,z,width,5,.055,y,M.frame,0,leaf);
    for(const px of [x1+8,x2-8])box(px,z,2,6,1.03,1.09,M.frame,0,leaf);
    box(x,z,width-12,6,.025,1.09,M.frame,0,leaf);
    box(x1+9,z-4,10,2,.025,1,M.metal,0,leaf);
    const hinge=new THREE.Vector3(X(x2),0,Z(z2));
    for(const part of leaf.children)part.position.sub(hinge);
    leaf.position.copy(hinge);leaf.position.x-=9*SCALE;leaf.rotation.y=Math.PI/2;
    solid(x2-9,z2+(x2-x1)/2,6,x2-x1);
  }
}
for(const [x1,z1,x2,z2,{id,sill,head,panels,rail,sashes=[],sashBottom,open,blinds=[]}] of windows) {
  const horizontal=z1===z2,w=horizontal?x2-x1:16,d=horizontal?16:z2-z1,x=(x1+x2)/2,z=(z1+z2)/2;
  box(x,z,w,d,sill,0,M.wall,0,architecture).name=id+'-sill';solid(x,z,w,d);
  box(x,z,w,d,CEILING-head,head,M.wall,0,overhead);
  if(open)continue; // Utility balcony has an open aperture above its masonry parapet.
  const frame=new THREE.Group();frame.name=id+'-window';glazing.add(frame);
  // Fractions run along the opening; all frame heights are in metres.
  const strip=(from,to,bottom,top,depth=5,mat=M.frame)=>box(
    x1+(x2-x1)*(from+to)/2,z1+(z2-z1)*(from+to)/2,
    horizontal?(x2-x1)*(to-from):depth,horizontal?depth:(z2-z1)*(to-from),
    top-bottom,bottom,mat,0,frame);
  const bar=3/Math.hypot(x2-x1,z2-z1);
  for(const y of [sill,head-.045])strip(0,1,y,y+.045);
  if(rail)strip(0,1,rail-.025,rail+.025);
  for(let i=0;i<=panels;i++)strip(Math.max(0,i/panels-bar/2),Math.min(1,i/panels+bar/2),sill,head).name='mullion';
  for(let i=0;i<panels;i++)strip(i/panels+bar/2,(i+1)/panels-bar/2,sill+.045,head-.045,1,M.glass).name='pane';
  for(const i of sashes) {
    const left=i/panels+bar,right=(i+1)/panels-bar;
    strip(left,right,sashBottom,sashBottom+.045,7);
    strip(left,right,head-.08,head-.055,7);
    for(const side of [left,right-bar/2])strip(side,side+bar/2,sashBottom,head-.055,7);
    strip((left+right)/2-.025,(left+right)/2+.025,sashBottom+.06,sashBottom+.075,9,M.metal);
  }
  // Cellular shades per panel, hung 13 cm inside the frame line as in the renderings.
  const inward=horizontal?(inside(x,z+12)?1:-1):(inside(x+12,z)?1:-1);
  for(const [i,[bottom,top]] of blinds.entries()) {
    const f=(i+.5)/panels,span=(horizontal?x2-x1:z2-z1)/panels-2;
    box(x1+(x2-x1)*f+(horizontal?0:inward*11),z1+(z2-z1)*f+(horizontal?inward*11:0),horizontal?span:1.5,horizontal?1.5:span,top-bottom,bottom,M.blind,0,frame);
  }
}
// Structural columns visible in the drawing.
for(const [x,z,w,d] of [[490,235,70,70],[1420,235,70,70],[1410,905,90,60],[515,905,105,70],[940,963,75,55]]) {
  box(x,z,w,d,CEILING,0,M.wall,0,architecture);solid(x,z,w,d);
}
const placementWalls=colliders.map(([x1,z1,x2,z2])=>[x1/SCALE+850,z1/SCALE+650,x2/SCALE+850,z2/SCALE+650]);
// Outline the joined footprint, not the end faces of individual wall blocks.
const wallFootprints=architecture.children.map(o=>{
  const {width,depth}=o.geometry.parameters,x=o.position.x/SCALE+850,z=o.position.z/SCALE+650;
  return [x-width/SCALE/2,z-depth/SCALE/2,x+width/SCALE/2,z+depth/SCALE/2].map(v=>Math.round(v*1000)/1000);
});
function edgeLines(points,parent) {
  const lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),wallEdgeMaterial);
  lines.renderOrder=1;parent.add(lines);return lines;
}
const halfWallThickness=Math.max(...walls.map(w=>w[4]??12))/2;
const cornerLines=edgeLines(wallCorners(wallFootprints).flatMap(([x,z])=>
  cornerSpan(x,z,doors,windows,halfWallThickness).map(y=>new THREE.Vector3(X(x),y,Z(z)))),architecture);
// Only the bottom of each header borders an opening; its top and ends are seams.
const openingLines=edgeLines([...doors,...windows].flatMap(([x1,z1,x2,z2,options],i)=>{
  const horizontal=z1===z2,half=i<doors.length?6:8,head=options?.head??2.25;
  return [-half,half].flatMap(offset=>[[x1,z1],[x2,z2]].map(([x,z])=>
    new THREE.Vector3(X(x+(horizontal?0:offset)),head,Z(z+(horizontal?offset:0)))));
}),overhead);

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
const furniture=[],furnitureStorageKey='f-residence-furniture-v1';
function movable(x,z,build) {
  const first=scene.children.length,firstCollider=colliders.length;
  build();
  const parts=scene.children.slice(first),group=new THREE.Group();
  group.position.set(X(x),0,Z(z));scene.add(group);
  for(const part of parts)group.attach(part);
  group.userData.colliders=colliders.slice(firstCollider);
  group.userData.home=group.position.clone();
  group.userData.homeColliders=group.userData.colliders.map(bounds=>[...bounds]);
  group.userData.layoutId=`${x},${z}`;
  furniture.push(group);
  return group;
}
function chair(x,z,angle=0,mat=M.linen) {
  const group=movable(x,z,()=>{
    box(x,z,36,36,.095,.43,mat,.045);
    box(x,z+15,36,5,.36,.49,mat,.035);
    for(const dx of [-13,13])for(const dz of [-13,13])box(x+dx,z+dz,2.5,2.5,.43,0,M.darkOak);
    solid(x,z,32,32);
  });
  group.rotation.y=angle;
}
function desk(x,z,w=45,d=95) {
  movable(x,z,()=>{
    box(x,z,w,d,.06,.75,M.oak,.02);solid(x,z,w,d);
    for(const dx of [-w/2+4,w/2-4])for(const dz of [-d/2+4,d/2-4])box(x+dx,z+dz,3,3,.75,0,M.darkOak);
    box(x,z-10,2,36,.27,.81,M.dark,.012);box(x-1.2,z-10,1,32,.22,.835,material('#8da09c',.45,{emissive:'#728e8f',emissiveIntensity:.15}));
    box(x-12,z-10,10,24,.018,.816,M.metal,.007);book(x,z+d/2-14,17,23,.82);lamp(x,z-d/2+14,.81);
  });
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
// Designer interior from the 2026-10-07 plan and renderings 1–10. Built-ins stop at 2.35 m under a bulkhead.
const BUILT_IN=2.35;
function led(x,z,w,d,h,y,parent=scene){const o=box(x,z,w,d,h,y,M.led,0,parent);o.castShadow=o.receiveShadow=false;return o;}
// Flush joinery: a dark carcass reads as the reveals between leaves on one face.
function joinery(x1,z1,x2,z2,y,h,face,cols=1,mat=M.whiteOak) {
  // Box faces run +x,-x,+y,-y,+z,-z; only the fronted face shows the reveal colour.
  const faces=Array(6).fill(mat);faces[{east:0,west:1,south:4,north:5}[face]]=M.reveal;
  box((x1+x2)/2,(z1+z2)/2,x2-x1,z2-z1,h,y,faces);solid((x1+x2)/2,(z1+z2)/2,x2-x1,z2-z1);
  const along=face==='east'||face==='west',len=(along?z2-z1:x2-x1)/cols;
  for(let i=0;i<cols;i++) {
    const c=(along?z1:x1)+len*(i+.5);
    if(along)box(face==='east'?x2+.5:x1-.5,c,1,len-.35,h-.006,y+.003,mat);
    else box(c,face==='south'?z2+.5:z1-.5,len-.35,1,h-.006,y+.003,mat);
  }
}
function bulkhead(x1,z1,x2,z2,y=BUILT_IN){box((x1+x2)/2,(z1+z2)/2,x2-x1,z2-z1,CEILING-y,y,M.paint,0,overhead);}
// Rounded ceiling soffits stand in for the renderings' curved bulkheads; the top edges hide above the ceiling.
function soffit(x1,z1,x2,z2,y=2.42){const o=box((x1+x2)/2,(z1+z2)/2,x2-x1,z2-z1,CEILING-y+.12,y,M.soffit,.1,overhead);o.castShadow=false;return o;}
function slot(x1,z1,x2,z2,y){const o=box((x1+x2)/2,(z1+z2)/2,x2-x1,z2-z1,.012,y-.012,M.reveal,0,overhead);o.castShadow=false;}
edgeLines([[640,560,725,625],[600,800,660,850],[905,330,985,395],[400,860,455,905]].flatMap(([x1,z1,x2,z2])=>
  [[x1,z1,x2,z1],[x2,z1,x2,z2],[x2,z2,x1,z2],[x1,z2,x1,z1]].flatMap(([a,b,c,d])=>
    [new THREE.Vector3(X(a),CEILING-.003,Z(b)),new THREE.Vector3(X(c),CEILING-.003,Z(d))])),overhead);

// Media wall (renderings 3–5): walnut-topped bench, TV niche below upper cabinets, tall doors, lit glass display, pillar.
box(550,497,42,436,.33,0,M.reveal);solid(550,497,42,436);
for(let i=0;i<8;i++)box(571.5,279+(i+.5)*436/8,1,436/8-.4,.27,.04,M.lacquer);
box(550.5,497,43,438,.035,.33,M.walnut);
joinery(529,279,565,526,1.72,BUILT_IN-1.72,'east',5);
box(547,402.5,36,247,.025,1.695,M.walnut);led(563,402.5,1.5,247,.006,1.69);
box(531.5,406,3,123,.83,.54,M.black,.008);box(533.2,406,.4,119,.79,.56,M.screen);
for(const z of [310,488])box(546,z,.6,.6,1.32,.37,M.steel);
box(544,392,30,205,.018,1.46,M.steel);box(544,506,30,40,.018,1.0,M.steel);
const ring=mesh(new THREE.TorusGeometry(.12,.035,10,28),M.lightOak,544,1.19,506);ring.rotation.y=Math.PI/2;box(544,506,6,6,.04,1.02,M.black);
ball(544,470,1.52,.07,.05,.03,M.charcoal);
for(let i=0;i<7;i++)ball(548,300+i*3,1.44-i*.07,.03,.05,.02,M.leaf);
joinery(529,526,565,588,1.72,BUILT_IN-1.72,'east');joinery(529,526,565,588,.68,1.03,'east');
joinery(529,588,565,648,.68,BUILT_IN-.68,'east');
box(547,702.5,36,109,.04,.62,M.lacquer);box(547,702.5,36,109,.03,2.32,M.lacquer);solid(547,702.5,36,109);
for(const y of [1.05,1.45,1.85]){box(547,702.5,34,107,.012,y,M.glass,0,glazing);led(563,702.5,.6,107,.004,y-.004);}
box(565,702.5,.5,109,1.68,.66,M.glass,0,glazing);box(547,757,36,.5,1.68,.66,M.glass,0,glazing);
led(564,649,1.2,1.2,1.68,.66);box(530,702.5,1,107,1.68,.66,material('#e6ddcf',.9));
for(const [z,y,s] of [[668,1.065,1],[690,1.465,.8],[680,1.865,1.1]]){cyl(546,z,5*s,.2*s,y,M.lacquer,3*s);}
box(547,736,36,42,.42,0,M.walnut);
box(585,736,40,42,CEILING,0,M.paint);solid(585,736,40,42);
bulkhead(529,279,565,757);soffit(529,279,612,757);slot(612,280,616,757,2.42);soffit(529,279,814,302);
plant(590,309,1.25);

// Living (renderings 3, 4, 6): low grey L-sofa with chaise toward the windows, peach canvas above.
box(776,401,70,212,.08,0,M.darkOak);box(698,331,70,74,.08,0,M.darkOak);
box(775.5,401,77,222,.32,.08,M.sofa,.04);box(698.5,331,78,82,.32,.08,M.sofa,.04);
for(const [z,d] of [[347,100],[447,98]])box(769,z,62,d,.1,.40,M.sofa,.05);
box(700,333,72,76,.1,.40,M.sofa,.05);
box(806,394,16,206,.34,.40,M.sofa,.06);box(737,295,154,11,.24,.40,M.sofa,.05);box(776,506,77,13,.2,.40,M.sofa,.05);
for(const z of [345,445])box(793,z,12,96,.24,.5,M.sofa,.07);
for(const [x,z,mat,r] of [[798,312,M.clay,.3],[795,430,M.charcoal,.2],[795,462,M.sofa,-.2],[715,300,M.sofa,.1]]){const o=box(x,z,10,32,.28,.5,mat,.06);o.rotation.set(r*.4,r,0);}
solid(775.5,401,77,222);solid(698.5,331,78,82);
movable(786,547,()=>{
  cyl(786,547,20,.03,.53,M.walnut);for(let i=0;i<3;i++){const a=i*2.1;box(786+Math.cos(a)*13,547+Math.sin(a)*13,1.5,1.5,.53,0,M.black);}
  cyl(786,547,5,.17,.56,M.glass,6);for(let i=0;i<9;i++)ball(786+Math.cos(i*.7)*(6+i),547+Math.sin(i*.7)*(6+i),.8+(i%3)*.05,.045,.022,.06,M.leaf);
  solid(786,547,40,40);
});
{
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),grad=g.createRadialGradient(150,110,10,128,128,190);
  grad.addColorStop(0,'#efe0d4');grad.addColorStop(.6,'#ddb7a3');grad.addColorStop(1,'#c99a85');g.fillStyle=grad;g.fillRect(0,0,256,256);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const canvasArt=mesh(new THREE.BoxGeometry(.035,1.04,1.04),[M.lacquer,material('#ffffff',.95,{map:tex}),M.lacquer,M.lacquer,M.lacquer,M.lacquer],812,1.78,348);canvasArt.castShadow=false;
}

// Dining (renderings 5, 6): stone top on dark steel, bench on the kitchen side, two bouclé chairs.
movable(738,718,()=>{
  box(738,718,136,72,.03,.72,M.quartz,.006);box(738,718,128,64,.04,.68,M.black);
  for(const x of [677,799])for(const z of [688,748])box(x,z,3.5,3.5,.68,0,M.black);
  solid(738,718,136,72);
});
movable(745,770,()=>{
  box(745,770,112,28,.045,.41,M.charcoal,.01);for(const x of [697,793])box(x,770,4,22,.41,0,M.charcoal);
  box(745,770,96,3,.035,.14,M.charcoal);solid(745,770,112,28);
});
function boucleChair(x,z,angle) {
  const group=movable(x,z,()=>{
    box(x,z,41,38,.08,.41,M.boucle,.035);
    mesh(new THREE.CylinderGeometry(.24,.24,.24,24,1,true,-1.15,2.3),M.boucleShell,x,.67,z-2);
    for(const dx of [-17,17])for(const dz of [-15,15])box(x+dx,z+dz,1.4,1.4,.42,0,M.black);
    const hoop=mesh(new THREE.TorusGeometry(.245,.007,6,24,2.3),M.black,x,.62,z-2);hoop.rotation.set(Math.PI/2,0,Math.PI/2-1.15);solid(x,z,38,38);
  });
  group.rotation.y=angle;
}
for(const x of [710,766])boucleChair(x,676,Math.PI);

// Entrance (renderings 1–3): floating walnut and white-oak shoe wall, walnut niche with pendants, mirror, oval cove.
joinery(279,890,424,926,.15,.7,'north',3,M.walnut);box(351.5,889.5,145,2,.025,.85,M.walnut);
joinery(279,890,424,926,.95,BUILT_IN-.95,'north',3);led(351.5,891,145,2,.006,.14);
bulkhead(279,890,460,926);
box(442,908,36,36,.035,.85,M.walnut);box(460.5,898,3,56,BUILT_IN,0,M.walnut);
for(const [x,z,y] of [[437,903,1.74],[446,911,1.5],[440,917,1.26]]) {
  box(x,z,.4,.4,CEILING-y-.07,y+.07,M.black,0,overhead);cyl(x,z,1.6,.05,y+.04,M.brass);
  ball(x,z,y,.055,.055,.055,material('#fff2da',.2,{emissive:'#ffd59a',emissiveIntensity:.9}));
}
const mirror=new THREE.Mesh(new THREE.PlaneGeometry(104*SCALE,BUILT_IN),M.mirror);
mirror.position.set(X(515),BUILT_IN/2,Z(863.4));mirror.rotation.y=Math.PI;overhead.add(mirror);
box(495,759.6,7,1,.09,1.2,M.black);box(302,759.6,8,1,.13,1.4,M.black);
box(527.5,774,75,32,.45,0,M.walnut);solid(527.5,774,75,32);
movable(462,792,()=>{
  cyl(462,792,17,.19,.27,M.boucle,16);for(const [dx,dz] of [[-11,-11],[11,-11],[11,11],[-11,11]])box(462+dx,792+dz,1.3,1.3,.27,0,M.black);
  solid(462,792,34,34);
});
{
  const shape=new THREE.Shape([[279,759],[529,759],[529,890],[279,890]].map(([x,z])=>new THREE.Vector2(X(x),-Z(z))));
  const ellipse=(r,clockwise)=>{const p=new THREE.Path();p.absellipse(X(392),-Z(822),1.2+r,.55+r,0,Math.PI*2,clockwise);return p;};
  shape.holes.push(ellipse(0,true));
  const drop=new THREE.Mesh(new THREE.ShapeGeometry(shape,48).rotateX(-Math.PI/2),material('#efeae1',.9,{side:THREE.DoubleSide}));drop.position.y=2.42;overhead.add(drop);
  const rim=new THREE.Shape();rim.absellipse(X(392),-Z(822),1.2,.55,0,Math.PI*2,false);rim.holes.push(ellipse(-.02,true));
  const disc=new THREE.Shape();disc.absellipse(X(392),-Z(822),1.2,.55,0,Math.PI*2,false);
  const glow=new THREE.Mesh(new THREE.ShapeGeometry(disc,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#f7f0e4',side:THREE.DoubleSide}));glow.position.y=CEILING-.004;overhead.add(glow);
  const cove=new THREE.Mesh(new THREE.ExtrudeGeometry(rim,{depth:.2,bevelEnabled:false,curveSegments:48}).rotateX(-Math.PI/2),M.led);cove.position.y=2.42;overhead.add(cove);
}

// Refrigerator wall (renderings 2, 4–6): whitewashed oak, walnut-lined fridge bay, appliance niche toward the kitchen.
joinery(776,846,816,927,0,BUILT_IN,'north');
box(817,886.5,1,80,.78,.01,M.whiteOak);box(817,886.5,1,80,.68,1.66,M.whiteOak);box(796,886.5,40,79,.02,1.22,M.whiteOak);
box(800,886,28,40,.3,1.24,M.black,.01);box(814.2,880,.3,24,.2,1.29,M.screen);cyl(799,886,11,.24,.8,M.lacquer,10);
box(708.5,886.5,3,81,1.95,0,M.walnut);box(772.5,886.5,3,81,1.95,0,M.walnut);box(740.5,886.5,67,81,.03,1.92,M.walnut);
box(740.5,889,61,74,1.85,0,M.fridgeGap);solid(740.5,886.5,67,81);
for(const dx of [-15.3,15.3])box(740.5+dx,851.5,30.2,1,.79,1.06,M.lacquer);
for(const y of [.55,.05])box(740.5,851.5,61,1,.48,y,M.lacquer);
joinery(707,846,774,927,1.95,BUILT_IN-1.95,'north');
joinery(633,846,705,927,0,1.95,'north',2);joinery(633,846,705,927,1.95,BUILT_IN-1.95,'north',2);
led(632,847,1,1,BUILT_IN,0);bulkhead(633,846,816,927);

// Kitchen (rendering 7): taupe run, quartz top, travertine-veneer splashback, grid cubbies, slim chimney hood.
box(930,790,46,272,.1,0,M.reveal);joinery(903,654,955,926,.1,.76,'west',7,M.taupe);
box(928.5,790,53,274,.04,.86,M.quartz);
box(925,718,32,50,.006,.9,material('#8b8781',.6));
const faucet=new THREE.Mesh(new THREE.TorusGeometry(.115,.012,8,24,Math.PI),M.steel);faucet.position.set(X(947),1.12,Z(718));faucet.rotation.y=Math.PI/2;scene.add(faucet);box(947,728,2,2,.17,.9,M.steel);
box(927,880,44,50,.008,.9,M.black);
box(954,742,2,176,1.55,.9,M.veneer);box(954,878,2,96,1.55,.9,material('#ece9e3',.25));box(958.5,900.5,7,51,CEILING,0,M.paint);
box(941,878,30,52,.035,1.62,material('#bdb8b0',.45));box(950,878,12,24,.8,1.655,material('#bdb8b0',.45));
M.cubby=material('#d4a77a',.6,{map:oakTex});
function cubbies(z1,z2,cols,y1=1.42,y2=2.12,rows=3) {
  for(let i=0;i<=cols;i++)box(942,z1+(z2-z1)*i/cols,26,1.4,y2-y1,y1,M.cubby);
  for(let j=0;j<=rows;j++)box(942,(z1+z2)/2,26,z2-z1,.016,y1+(y2-y1)*j/rows-.008,M.cubby);
  for(let i=0;i<cols;i+=2)cyl(943,z1+(z2-z1)*(i+.5)/cols,3,.08,y1+(y2-y1)*(i%3)/rows+.01,M.lacquer);
}
cubbies(662,700,2);cubbies(704,770,4);cubbies(773,818,3);
for(const [z,s] of [[812,1],[824,.9]]){ball(930,z,.95,.07*s,.06*s,.07*s,material('#a48a66',1,{map:fabricTex}));ball(930,z,1.02,.045,.045,.045,material('#9cc24a',.5));}
led(903,790,1,280,.01,CEILING-.012,overhead);led(929,652,52,1,.01,CEILING-.012,overhead);
cabinet(994,710,33,120,BUILT_IN,M.whiteOak,'east');cabinet(994,819,33,90,BUILT_IN,M.whiteOak,'east');

// Daughter's room (renderings 8–10): leaf mural, light-oak bed, arched white sliding wardrobe, oak-lined entry, hanging shelves.
{
  const map=loader.load('assets/tex-mural.jpg',()=>requestRender());map.colorSpace=THREE.SRGBColorSpace;
  const mural=new THREE.Mesh(new THREE.PlaneGeometry(211*SCALE,1.74),material('#ffffff',.9,{map}));
  mural.position.set(X(1073.6),CEILING-.87,Z(384.5));mural.rotation.y=-Math.PI/2;mural.receiveShadow=true;scene.add(mural);
  box(1073.6,384.5,.2,211,CEILING-1.74,0,material('#ddd7cc',.9));
}
box(989.5,519.5,169,59,BUILT_IN,0,material('#d6cfc3',.9));solid(989.5,519.5,169,59);led(905.6,489,.8,1,BUILT_IN-.46,0);
{
  const w=85*SCALE,h=BUILT_IN-.01,r=.45,s=new THREE.Shape();
  s.moveTo(0,0);s.lineTo(w,0);s.lineTo(w,h);s.lineTo(r,h);s.absarc(r,h-r,r,Math.PI/2,Math.PI,false);s.lineTo(0,0);
  const leaf=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.02,bevelEnabled:false,curveSegments:24}),M.lacquer);
  leaf.position.set(X(905),0,Z(487.6));leaf.castShadow=leaf.receiveShadow=true;scene.add(leaf);
  box(1032,487.4,84,1.6,h,0,M.lacquer);box(990,486.5,.4,.4,h,0,M.reveal);
  const arc=mesh(new THREE.TorusGeometry(r,.013,6,24,Math.PI/2),M.led,905+r/SCALE,h-r,487.3);arc.rotation.z=Math.PI/2;arc.castShadow=false;
}
box(904,537.5,2,95,BUILT_IN,0,M.lightOak);box(865.5,537.5,79,95,CEILING-BUILT_IN,BUILT_IN,M.lightOak,0,overhead);
bulkhead(905,490,1074,549);box(989.5,489.6,150,.5,.07,2.44,M.reveal,0,overhead);soffit(826,279,1074,300,2.45);soffit(826,279,846,490,2.45);
joinery(905,561,1074,585,0,BUILT_IN,'south',4);bulkhead(905,561,1074,585);
{
  const x1=907,x2=1070,z1=327,z2=420,cx=(x1+x2)/2,cz=(z1+z2)/2;
  for(const x of [x1+2,x2-2])for(const z of [z1+2,z2-2])box(x,z,3.5,3.5,x>cx?.92:.52,0,M.lightOak);
  for(const z of [z1+2,z2-2])box(cx,z,x2-x1-4,2.5,.11,.24,M.lightOak);
  for(const y of [.43,.84])box(x2-2,cz,2.5,z2-z1-4,.07,y,M.lightOak);box(x1+2,cz,2.5,z2-z1-4,.07,.43,M.lightOak);
  box(cx-1,cz,x2-x1-8,z2-z1-6,.2,.33,M.linen,.05);box(cx-12,cz,x2-x1-34,z2-z1-2,.05,.52,M.lacquer,.025);
  const throwMat=material('#aaa7a1',1,{map:fabricTex});
  box(x1+22,cz,34,z2-z1+6,.03,.56,throwMat,.012);for(const z of [z1-2,z2+2])box(x1+22,z,34,1.5,.28,.29,throwMat);
  box(x2-14,cz,15,62,.14,.55,M.linen,.06);const p=box(x2-25,cz+6,12,54,.15,.57,material('#e9d27e',1,{map:fabricTex}),.06);p.rotation.z=.35;
  solid(cx,cz,x2-x1,z2-z1);
}
movable(1051,307,()=>{
  cyl(1051,307,21,.03,.55,M.lightOak);
  for(let i=0;i<3;i++){const a=i*2.1+.5;box(1051+Math.cos(a)*15,307+Math.sin(a)*15,2,2,.55,0,M.lightOak);}
  for(let i=0;i<3;i++){const a=i*2.1,o=box(1051+Math.cos(a)*3,307+Math.sin(a)*3,1,1,.12,.58,M.lightOak);o.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);}
  cyl(1051,307,9,.2,.7,material('#fbf6ec',.9,{emissive:'#ffe2b0',emissiveIntensity:.25}));solid(1051,307,42,42);
});
movable(1050,453,()=>{
  box(1050,453,40,70,.025,.75,material('#9a8f84',.6));for(const dx of [-17,17])for(const dz of [-31,31])box(1050+dx,453+dz,2.5,2.5,.75,0,M.lightOak);
  const glass=mesh(new THREE.CylinderGeometry(.19,.19,.012,40),M.mirror,1062,1.15,453);glass.rotation.z=Math.PI/2;
  const rim=mesh(new THREE.TorusGeometry(.19,.008,8,40),M.lightOak,1062,1.15,453);rim.rotation.y=Math.PI/2;
  for(const dz of [-17,17])box(1062,453+dz,1.5,1.5,.42,.775,M.lightOak);solid(1050,453,40,70);
});
movable(1006,455,()=>{
  box(1006,455,38,38,.04,.43,material('#c9b088',1,{map:fabricTex}),.01);
  for(const dx of [-15,15])for(const dz of [-15,15])box(1006+dx,455+dz,2.5,2.5,dx<0?.72:.43,0,M.lightOak);
  const back=mesh(new THREE.TorusGeometry(.17,.012,8,24,Math.PI),M.lightOak,993,.72,455);back.rotation.set(-Math.PI/2,0,Math.PI/2);
  box(992,455,1.6,6,.28,.44,M.lightOak);solid(1006,455,38,38);
});
for(const [y,z1,z2] of [[1.11,279,391],[1.40,304,393],[1.72,279,353]])box(837,(z1+z2)/2,21,z2-z1,.025,y,M.lightOak);
box(840,338,1.6,106,.02,1.02,M.lacquer);for(const z of [330,383])box(844,z,.6,.6,CEILING-1.0,1.0,M.lacquer,0,overhead);
for(const z of [318,356])box(846,z,38,3,.62,.38,M.linen,.02);
for(let i=0;i<7;i++)box(838,312+i*2.2,14,1.8,.19+(i%3)*.03,1.425,[M.lacquer,M.clay,M.linen][i%3]);
ball(838,345,1.82,.07,.07,.03,M.charcoal);box(837,330,2,12,.16,1.135,M.lightOak);for(let i=0;i<6;i++)ball(838,372+i,1.17,.03,.05,.03,M.leaf);
// Main bedroom and study keep the earlier interpretation; no renderings cover them yet.
bed(1288,451,161,163,M.sage);cabinet(1112,402,43,241,2.3,M.oak,'east');
for(const z of [341,557])movable(1360,z,()=>{cyl(1360,z,20,.46,0,M.oak);solid(1360,z,40,40);lamp(1360,z,.46);});
plant(1157,301,.8);
desk(1197,792,42,135);
const studyStool=movable(1157,797,()=>{
  const stool=createStool(()=>requestRender());
  stool.position.set(X(1157),0,Z(797));scene.add(stool);
  solid(1157,797,.35/SCALE,.35/SCALE);
});
studyStool.rotation.y=-Math.PI/2;
const daughterStool=movable(918,468,()=>{
  const stool=createStool2();
  stool.position.set(X(918),0,Z(468));scene.add(stool);
  solid(918,468,.35/SCALE,.35/SCALE);
});
cabinet(1198,708,43,99,2.15,M.oak,'west');
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
art(1210,632,62,1,Math.PI);
const warmLights=[];
for(const [x,z] of [[692,424],[733,720],[985,407],[1250,442],[1100,764],[856,805],[1305,747],[507,982],[770,1010],[396,820]]) {
  const light=new THREE.PointLight('#ffca88',15,5,2);light.visible=false;light.position.set(X(x),2.45,Z(z));scene.add(light);warmLights.push(light);
}

for(const object of furniture)object.userData.homeAngle=object.rotation.y;

let mode='overview',fullWalls=false,evening=false,editing=false,yaw=0,pitch=0,currentRoom='',drag=null,lastTime=0;
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
  requestRender(true);
}
function resetView() {
  orbit.target.set(.1,0,.2);
  camera.position.set(-11.3,15.8,18.7);
  if(innerWidth<801)camera.position.multiplyScalar(Math.max(1.3,.9/camera.aspect));
  camera.fov=39;camera.updateProjectionMatrix();orbit.update();
}
function setMode(next,room=rooms[0]) {
  if(next==='walk'&&editing)editMode(false);
  endFurnitureDrag();keys.clear();drag=null;
  if(document.pointerLockElement)document.exitPointerLock();
  mode=next;document.body.classList.toggle('walking',mode==='walk');orbit.enabled=mode==='overview';
  for(const id of ['overview','walk']){$('#'+id).classList.toggle('active',mode===id);$('#'+id).setAttribute('aria-pressed',String(mode===id));}
  wallState();
  if(mode==='overview'){resetView();$('#hint').innerHTML='Choose Edit furniture to move pieces <i>·</i> Drag elsewhere to orbit';currentRoom='';updateRoom();}
  else {
    camera.fov=67;camera.updateProjectionMatrix();camera.position.set(X(room.point[0]),1.62,Z(room.point[1]));
    yaw=Math.atan2(-(room.look[0]-room.point[0]),-(room.look[1]-room.point[1]));pitch=['bath','guest','utility','kitchen'].includes(room.id)?-.48:-.2;
    look();updateRoom();$('#hint').textContent=matchMedia('(pointer:coarse)').matches?'Drag to look · Arrow pad to move':'WASD / arrows to move · Drag to look · Esc releases mouse';
  }
  renderer.domElement.tabIndex=-1;renderer.domElement.focus({preventScroll:true});
}
function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);requestRender();}
for(const [i,r] of rooms.entries()) {
  const b=document.createElement('button');b.dataset.room=r.id;b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><span>${r.name}</span><span class="arrow">↗</span>`;b.addEventListener('click',()=>setMode('walk',r));$('#rooms').append(b);
}
function updateRoom(){
  const px=camera.position.x/SCALE+850,pz=camera.position.z/SCALE+650;
  const room=mode==='walk'?rooms.find(r=>inside(px,pz,r.poly)):null;
  const id=room?.id||'';
  if(id!==currentRoom||mode==='overview') {
    currentRoom=id;$('#room-name').textContent=room?.name||'Hallway';
    for(const b of $('#rooms').children){b.classList.toggle('active',b.dataset.room===id);b.setAttribute('aria-current',b.dataset.room===id?'location':'false');}
  }
}
$('#overview').onclick=()=>setMode('overview');$('#walk').onclick=()=>setMode('walk');
function cleanView(on=!document.body.classList.contains('clean-view')) {
  document.body.classList.toggle('clean-view',on);
  $('#clean').setAttribute('aria-pressed',String(on));
  $('#clean').title=on?'Show interface':'Hide interface; Esc restores it';
  $('#clean span').textContent=on?(editing?'Finish editing':'Show controls'):'Clean view';
}
function editMode(on=!editing) {
  if(on&&mode!=='overview')setMode('overview');
  editing=on;$('#edit').setAttribute('aria-pressed',String(on));
  cleanView(on);
}
$('#edit').onclick=()=>editMode();
$('#clean').onclick=()=>editing?editMode(false):cleanView();
$('#reset').onclick=()=>{
  endFurnitureDrag();
  for(const object of furniture)placeFurniture(object,object.userData.home,object.userData.homeAngle);
  setMode(mode);saveFurniture();
};
$('#walls').onclick=()=>{fullWalls=!fullWalls;wallState();};
$('#light').onclick=()=>{
  evening=!evening;$('#light').setAttribute('aria-pressed',String(evening));$('#light span').textContent=evening?'Evening':'Daylight';
  sun.intensity=evening?.15:3.5;hemi.intensity=evening?.55:1.4;fill.intensity=evening?.25:1;scene.environmentIntensity=evening?.12:.22;
  for(const l of warmLights)l.visible=evening; // hidden lights leave the shaders; intensity 0 would not
  scene.background.set(evening?'#c5c8bf':'#edece5');requestRender();
};
function showDialog(id){keys.clear();if(document.pointerLockElement)document.exitPointerLock();$(id).showModal();}
$('#source').onclick=()=>showDialog('#plan-dialog');$('#help').onclick=()=>showDialog('#help-dialog');
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
const movement={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.classList.contains('clean-view')&&!document.querySelector('dialog[open]'))editing?editMode(false):cleanView(false);});
addEventListener('keydown',e=>{if(mode!=='walk'||document.querySelector('dialog[open]')||e.target.matches('button,a,input'))return;if(movement[e.code]){e.preventDefault();keys.add(movement[e.code]);requestRender();}});
addEventListener('keyup',e=>{if(movement[e.code])keys.delete(movement[e.code]);});
const furnitureRay=new THREE.Raycaster(),pointer=new THREE.Vector2();
let furnitureDrag=null,lastFurnitureTap=null;
addEventListener('keydown',e=>{
  if(e.code==='Space'&&furnitureDrag) {
    e.preventDefault();
    if(!e.repeat){furnitureDrag.object.rotation.y=(furnitureDrag.object.rotation.y+Math.PI/2)%(Math.PI*2);requestRender(true);}
  }
});
function aimFurniture(e) {
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);
  furnitureRay.setFromCamera(pointer,camera);
}
function placeFurniture(object,position,angle=object.rotation.y) {
  const start=object.position.clone(),startAngle=object.rotation.y;
  object.position.copy(position);object.rotation.y=angle;
  // ponytail: conservative bounding rectangle; use mesh footprints if tighter placement is needed.
  const {min,max}=new THREE.Box3().setFromObject(object,true);
  if(!fitsFurniture([min.x/SCALE+850,min.z/SCALE+650,max.x/SCALE+850,max.z/SCALE+650],placementWalls)) {
    object.position.copy(start);object.rotation.y=startAngle;
  }
  const {home,homeAngle,homeColliders}=object.userData;
  const rotation=new THREE.Matrix4().makeRotationY(object.rotation.y-homeAngle);
  homeColliders.forEach(([x1,z1,x2,z2],i)=>{
    const bounds=new THREE.Box3(new THREE.Vector3(x1-home.x,0,z1-home.z),new THREE.Vector3(x2-home.x,0,z2-home.z));
    bounds.applyMatrix4(rotation).translate(object.position);
    object.userData.colliders[i].splice(0,4,bounds.min.x,bounds.min.z,bounds.max.x,bounds.max.z);
  });
  requestRender(true);
}
function rotateFurniture(object) {
  placeFurniture(object,object.position.clone(),(object.rotation.y+Math.PI/2)%(Math.PI*2));saveFurniture();
}
function saveFurniture() {
  try {
    localStorage.setItem(furnitureStorageKey,JSON.stringify(Object.fromEntries(furniture.map(object=>
      [object.userData.layoutId,[object.position.x,object.position.z,object.rotation.y]]))));
  } catch(error) {
    console.warn('Unable to save furniture positions',error);
    $('#hint').textContent='Positions could not be saved in this browser.';
  }
}
function restoreFurniture() {
  try {
    const saved=JSON.parse(localStorage.getItem(furnitureStorageKey));
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
    for(const object of furniture) {
      const position=saved[object.userData.layoutId];
      if(Array.isArray(position)&&[2,3].includes(position.length)&&position.every(Number.isFinite))
        placeFurniture(object,new THREE.Vector3(position[0],0,position[1]),position[2]??object.userData.homeAngle);
    }
  } catch(error) {console.warn('Unable to restore furniture positions',error);}
}
function endFurnitureDrag() {
  if(!furnitureDrag)return;
  const {id,object,start,startAngle}=furnitureDrag;furnitureDrag=null;
  const position=object.position.clone(),angle=object.rotation.y;
  object.position.copy(start);object.rotation.y=startAngle;
  placeFurniture(object,position,angle);saveFurniture();
  if(renderer.domElement.hasPointerCapture(id))renderer.domElement.releasePointerCapture(id);
  orbit.enabled=mode==='overview';renderer.domElement.style.cursor='';
}
renderer.domElement.addEventListener('pointerdown',e=>{
  if(mode!=='overview'||!editing||(e.pointerType==='mouse'&&e.button!==0)||furnitureDrag)return;
  aimFurniture(e);
  let object=furnitureRay.intersectObjects(scene.children,true).find(hit=>{
    if(!hit.object.isMesh)return false;
    for(let parent=hit.object;parent;parent=parent.parent)if(!parent.visible)return false;
    return true;
  })?.object;
  while(object&&!furniture.includes(object))object=object.parent;
  if(!object)return;
  const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),point=new THREE.Vector3();
  if(!furnitureRay.ray.intersectPlane(plane,point))return;
  furnitureDrag={object,plane,start:object.position.clone(),startAngle:object.rotation.y,offset:object.position.clone().sub(point),id:e.pointerId};
  orbit.enabled=false;renderer.domElement.style.cursor='grabbing';
  renderer.domElement.setPointerCapture(e.pointerId);
  e.stopImmediatePropagation();e.preventDefault();
},true);
renderer.domElement.addEventListener('pointermove',e=>{
  if(!furnitureDrag||e.pointerId!==furnitureDrag.id)return;
  aimFurniture(e);
  const {object,plane,offset}=furnitureDrag,point=new THREE.Vector3();
  if(!furnitureRay.ray.intersectPlane(plane,point))return;
  point.add(offset);
  object.position.x=point.x;object.position.z=point.z;requestRender(true);
});
renderer.domElement.addEventListener('pointerup',e=>{
  const object=furnitureDrag?.object;
  if(e.pointerId!==furnitureDrag?.id)return;
  const rotate=e.pointerType==='touch'&&lastFurnitureTap?.object===object&&e.timeStamp-lastFurnitureTap.time<600;
  endFurnitureDrag();
  if(rotate){rotateFurniture(object);lastFurnitureTap=null;}
  else lastFurnitureTap={object,time:e.timeStamp};
});
for(const event of ['pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,e=>{
  if(e.pointerId===furnitureDrag?.id)endFurnitureDrag();
});
addEventListener('blur',()=>{endFurnitureDrag();keys.clear();drag=null;});
document.addEventListener('visibilitychange',()=>{
  endFurnitureDrag();keys.clear();drag=null;
  if(document.hidden){cancelAnimationFrame(frameId);frameId=0;lastTime=0;}
  else requestRender();
});
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
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.move);requestRender();b.setPointerCapture(e.pointerId);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);requestRender();}
addEventListener('resize',resize);
function move(dt) {
  let forward=Number(keys.has('forward'))-Number(keys.has('back')),side=Number(keys.has('right'))-Number(keys.has('left'));
  const length=Math.hypot(forward,side);if(!length)return;
  const speed=1.7*dt/length,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  // Small substeps prevent skipping a narrow wall after a slow frame.
  const steps=Math.ceil(Math.hypot(dx,dz)/.06);
  for(let i=0;i<steps;i++){if(canStand(camera.position.x+dx/steps,camera.position.z))camera.position.x+=dx/steps;if(canStand(camera.position.x,camera.position.z+dz/steps))camera.position.z+=dz/steps;}
}
let frameId=0;
function requestRender(shadows=false) {
  if(shadows)renderer.shadowMap.needsUpdate=true;
  if(!frameId&&!document.hidden)frameId=requestAnimationFrame(renderFrame);
}
function renderFrame(time) {
  const dt=lastTime?Math.min((time-lastTime)/1000,.05):1/60;lastTime=time;
  const walking=mode==='walk'&&keys.size>0&&!document.querySelector('dialog[open]');
  const orbiting=mode==='overview'&&!furnitureDrag&&orbit.update();
  if(walking){move(dt);updateRoom();}
  renderer.render(scene,camera);
  frameId=0;
  if(walking||orbiting)requestRender();else lastTime=0;
}
orbit.addEventListener('change',()=>requestRender());
renderer.domElement.addEventListener('webglcontextrestored',()=>requestRender(true));
restoreFurniture();
setMode('overview');
renderer.render(scene,camera);$('#loading').classList.add('done');
// Small read-only diagnostics also let the browser check movement against actual rendered geometry.
window.apartment={get mode(){return mode;},get position(){return {x:camera.position.x,z:camera.position.z};},get room(){return currentRoom;},get meshes(){return renderer.info.render.calls;},canStand,rooms,colliders,revision:THREE.REVISION};
