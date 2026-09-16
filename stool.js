import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Metres; origin is the centre of the footprint at floor level.
export function createStool(onTextureLoad=()=>{}) {
  const stool=new THREE.Group();
  stool.name='Study wood stool';
  const loader=new THREE.TextureLoader();
  const load=name=>{
    const map=loader.load(new URL(`./assets/stool-${name}.jpg`,import.meta.url).href,onTextureLoad);
    map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
    return map;
  };
  const topMap=load('top'),frameMap=load('frame');
  const finish=map=>new THREE.MeshPhysicalMaterial({map,color:'#d4c6af',roughness:.46,clearcoat:.32,clearcoatRoughness:.3});
  const top=finish(topMap),frame=finish(frameMap);
  // UVs sample only the wood in the original, unmodified photographs.
  // ponytail: photo lighting is baked in; use cross-polarized scans for relightable albedo.
  const topQuad=[[114,251],[950,244],[971,1103],[90,1098]];
  const legQuad=[[135,512],[259,510],[279,1283],[177,1287]];
  const railQuad=[[276,551],[807,537],[797,635],[277,649]];
  const edgeQuad=[[276,508],[812,500],[809,531],[276,537]];
  function photoUV(uv,i,u,v,quad) {
    const [a,b,c,d]=quad;
    const x=(1-v)*(a[0]*(1-u)+b[0]*u)+v*(d[0]*(1-u)+c[0]*u);
    const y=(1-v)*(a[1]*(1-u)+b[1]*u)+v*(d[1]*(1-u)+c[1]*u);
    uv.setXY(i,x/1024,1-y/1365);
  }
  function add(geometry,materials,name,x,y,z) {
    const part=new THREE.Mesh(geometry,materials);
    part.name=name;part.position.set(x,y,z);
    part.castShadow=part.receiveShadow=true;stool.add(part);
    return part;
  }
  // Corner posts reach the seat surface: the striped end joints are not an overlay.
  for(const x of [-.146,.146])for(const z of [-.146,.146]) {
    const geo=new RoundedBoxGeometry(.058,.45,.058,3,.0014);
    const {position,uv}=geo.attributes;
    for(const group of geo.groups)for(let i=group.start;i<group.start+group.count;i++) {
      if(group.materialIndex===2||group.materialIndex===3)
        photoUV(uv,i,(position.getX(i)+x+.175)/.35,(position.getZ(i)+z+.175)/.35,topQuad);
      else photoUV(uv,i,uv.getX(i),1-uv.getY(i),legQuad);
    }
    add(geo,[frame,frame,top,top,frame,frame],'Corner post',x,.225,z);
  }
  // A single notched slab fits between the four posts, with a fine joint clearance.
  const e=.1742,n=.1174;
  const points=[[-n,-e],[n,-e],[n,-n],[e,-n],[e,n],[n,n],[n,e],[-n,e],[-n,n],[-e,n],[-e,-n],[-n,-n]];
  const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,z)));
  const seat=new THREE.ExtrudeGeometry(shape,{depth:.0204,steps:1,bevelEnabled:true,bevelThickness:.0008,bevelSize:.0008,bevelSegments:3,curveSegments:1});
  seat.rotateX(Math.PI/2);
  const {position,normal,uv}=seat.attributes;
  for(const group of seat.groups)for(let i=group.start;i<group.start+group.count;i++) {
    if(group.materialIndex===0)photoUV(uv,i,(position.getX(i)+.175)/.35,(position.getZ(i)+.175)/.35,topQuad);
    else photoUV(uv,i,((Math.abs(normal.getX(i))>.5?position.getZ(i):position.getX(i))+.175)/.35,-position.getY(i)/.022,edgeQuad);
  }
  add(seat,[top,frame],'Notched seat',0,.4492,0);
  for(const axis of ['x','z'])for(const side of [-1,1]) {
    const geo=new RoundedBoxGeometry(.238,.052,.021,3,.001);
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)photoUV(uv,i,uv.getX(i),1-uv.getY(i),railQuad);
    const apron=add(geo,frame,'Apron',axis==='z'?side*.141:0,.401,axis==='x'?side*.141:0);
    if(axis==='z')apron.rotation.y=Math.PI/2;
  }
  return stool;
}
