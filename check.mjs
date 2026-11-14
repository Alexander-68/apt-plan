import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { ORIGIN_X, ORIGIN_Z, X, Z, unX, unZ, CEILING, outline, rooms, windows, doors, walls, inside, fitsFurniture } from './plan.js';
import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { wallCorners, cornerSpan } from './wall-edges.js';

const EPS=1e-9;
const EXPECTED_ROOMS=['living','entry','daughter','master','study','kitchen','bath','guest','utility'];
// A blank or single-colour frame (the old photo-daughter.png) samples far below this; real interior
// views sample in the hundreds to thousands.
const SCREENSHOT_MIN_COLOURS=50;
const sortCorners=corners=>corners.slice().sort(([ax,az],[bx,bz])=>ax-bx||az-bz);
const thickness=run=>run[4]??12;
// Wall footprints as app.js builds them: each run is thickened, and each end is extended to the
// outer face of the thickest wall meeting there unless it stops flush at an opening.
function wallFootprints(runs,openings=[...doors,...windows]) {
  return runs.map(([x1,z1,x2,z2,t=12])=>{
    const horizontal=z1===z2;
    const meetsOpening=(x,z)=>openings.some(([a,b,c,d])=>horizontal===(b===d)&&((x===a&&z===b)||(x===c&&z===d)));
    const reach=(x,z)=>Math.max(t/2,...runs.filter(([a,b,c,d])=>b===d
      ? z===b&&x>=Math.min(a,c)&&x<=Math.max(a,c)
      : a===c&&x===a&&z>=Math.min(b,d)&&z<=Math.max(b,d)).map(([,,, ,u=12])=>u/2));
    const start=meetsOpening(x1,z1)?0:reach(x1,z1),end=meetsOpening(x2,z2)?0:reach(x2,z2);
    const w=horizontal?x2-x1+start+end:t,d=horizontal?t:z2-z1+start+end;
    const cx=(x1+x2)/2+(horizontal?(end-start)/2:0),cz=(z1+z2)/2+(horizontal?0:(end-start)/2);
    return [cx-w/2,cz-d/2,cx+w/2,cz+d/2];
  });
}
// Maximal chains of collinear runs that touch end to end.
function wallChains(runs) {
  const lines=new Map();
  for(const run of runs){const key=run[1]===run[3]?'H'+run[1]:'V'+run[0];if(!lines.has(key))lines.set(key,[]);lines.get(key).push(run);}
  const chains=[];
  for(const [key,line] of lines) {
    const horizontal=key[0]==='H';
    const lo=run=>horizontal?Math.min(run[0],run[2]):Math.min(run[1],run[3]);
    const hi=run=>horizontal?Math.max(run[0],run[2]):Math.max(run[1],run[3]);
    const sorted=line.slice().sort((a,b)=>lo(a)-lo(b));
    for(let i=0;i<sorted.length;) {
      const chain=[sorted[i]];let end=hi(sorted[i]);
      while(i+1<sorted.length&&lo(sorted[i+1])<=end+EPS){i++;chain.push(sorted[i]);end=Math.max(end,hi(sorted[i]));}
      chains.push(chain);i++;
    }
  }
  return chains;
}
const distanceToOutline=(x,z)=>{
  let best=Infinity;
  for(let i=0;i<outline.length;i++) {
    const [ax,az]=outline[i],[bx,bz]=outline[(i+1)%outline.length];
    const vx=bx-ax,vz=bz-az,wx=x-ax,wz=z-az;
    const t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));
    best=Math.min(best,Math.hypot(x-(ax+vx*t),z-(az+vz*t)));
  }
  return best;
};

// ---- wall-edge geometry ----
assert.deepEqual(wallCorners([[0,0,4,1],[0,0,1,4]]),[[0,0],[0,4],[4,0],[4,1],[1,1],[1,4]],'L junction has outer and inner corners without block seams');
// The intro's floor areas are the room polygons summed (utility balcony excluded from the first).
{
  const area=poly=>Math.abs(poly.reduce((sum,[x,z],i)=>{const [x2,z2]=poly[(i+1)%poly.length];return sum+x*z2-x2*z;},0))/2*(X(1)-X(0))**2;
  const total=rooms.reduce((sum,room)=>sum+area(room.poly),0),interior=total-area(rooms.find(room=>room.id==='utility').poly);
  const html=await readFile('index.html','utf8'),PING=3.305785;
  for(const m of [interior,total])assert.ok(html.includes(`<b>${m.toFixed(1)} m² · ${(m/PING).toFixed(1)} 坪</b>`),`index.html shows ${m.toFixed(1)} m² · ${(m/PING).toFixed(1)} 坪 from the room polygons`);
}
assert.deepEqual(wallCorners([[0,0,2,1],[2,0,4,1]]),[[0,0],[0,1],[4,0],[4,1]],'Straight wall joins have no corner lines');
assert.deepEqual(cornerSpan(3,1,[[2,0,4,0]],[],1),[0,2.25],'Door jamb stops at header');
assert.deepEqual(cornerSpan(1,1,[[2,0,4,0]],[],1),[0,CEILING],'Adjacent room corner stays full height');
assert.deepEqual(cornerSpan(1390,450,doors,windows,9),[.89,2.455],'Bedroom side window follows the W156.5/63+26 annotation');
assert.deepEqual(cornerSpan(600,1095,doors,windows,9),[1.48,2.26],'Guest bathroom window follows the W78/148 annotation');
assert.deepEqual(cornerSpan(270,820,doors,windows,9),[0,2.2],'Entrance jamb follows its door height');
// A real T junction from the plan: the study wall [960,640,960,875,10] meets the through-wall
// [900,640,1010,640,10]. Half-thickness footprints give exactly two concave corners; a seam in
// the middle of the through-wall (or a missing concave corner) fails.
{
  const inflate=([x1,z1,x2,z2,t=12])=>[x1-t/2,z1-t/2,x2+t/2,z2+t/2];
  const through=inflate([900,640,1010,640,10]),stem=inflate([960,640,960,875,10]);
  const corners=wallCorners([through,stem]);
  const quadrants=([x,z])=>[[-1,-1],[1,-1],[1,1],[-1,1]].filter(([dx,dz])=>
    [through,stem].some(([a,b,c,d])=>x+dx*.001>a&&x+dx*.001<c&&z+dz*.001>b&&z+dz*.001<d)).length;
  assert.deepEqual(sortCorners(corners.filter(([x,z])=>quadrants([x,z])===3)),[[955,645],[965,645]],'T junction has exactly the two concave corners (955,645) and (965,645)');
  assert.deepEqual(sortCorners(corners),sortCorners([[895,635],[895,645],[1015,635],[1015,645],[955,645],[965,645],[955,880],[965,880]]),'T junction draws no spurious corner along the through-wall or its stem');
}

// ---- plan origin and metric inverses ----
assert.deepEqual([X(ORIGIN_X),Z(ORIGIN_Z)],[0,0],'X/Z map the exported plan origin to the world origin');
assert.equal(unX(0),ORIGIN_X,'unX inverts X at the origin');
assert.equal(unZ(0),ORIGIN_Z,'unZ inverts Z at the origin');
assert.ok(Math.abs(unX(X(1234.5))-1234.5)<1e-9&&Math.abs(unZ(Z(987.25))-987.25)<1e-9,'unX/unZ invert X/Z away from the origin');

// ---- windows: heights, real gaps, flanking thickness, exposed frames ----
const footprints=wallFootprints(walls);
for(const [x1,z1,x2,z2,{id,sill,head,depth}] of windows) {
  assert.ok(sill>0&&head>sill&&head<CEILING,`${id} fits between floor and ceiling`);
  assert.ok(!walls.some(([a,b,c,d])=>z1===z2
    ? b===z1&&d===z1&&Math.min(c,x2)>Math.max(a,x1)
    : a===x1&&c===x1&&Math.min(d,z2)>Math.max(b,z1)),`${id} opening is a real gap: no collinear wall run covers its span`);
  // plan.js rule 1: each window's depth matches the wall run it interrupts, so the sill and the
  // wall faces share one corner line.
  const horizontal=z1===z2;
  for(const [ex,ez] of [[x1,z1],[x2,z2]]) {
    const flanking=walls.filter(([a,b,c,d])=>horizontal
      ? b===d&&b===ez&&(Math.abs(a-ex)<EPS||Math.abs(c-ex)<EPS)
      : a===c&&a===ex&&(Math.abs(b-ez)<EPS||Math.abs(d-ez)<EPS));
    assert.ok(flanking.length>0,`${id} endpoint ${ex},${ez} is interrupted by a wall run`);
    assert.ok(flanking.every(run=>thickness(run)===depth),`${id} flanking walls share its ${depth} px depth at ${ex},${ez} (found ${flanking.map(thickness).join('/')})`);
  }
  // Data-level replacement for the old mesh scan: no wall footprint may cover the clear span.
  const covered=footprints.some(rect=>horizontal
    ? rect[1]<z1&&rect[3]>z1&&Math.min(rect[2],x2)-Math.max(rect[0],x1)>EPS
    : rect[0]<x1&&rect[2]>x1&&Math.min(rect[3],z2)-Math.max(rect[1],z1)>EPS);
  assert.ok(!covered,`${id} window frame is exposed: no wall footprint crosses its opening`);
}

// ---- plan.js rule 2: joined runs on one wall line share a thickness ----
{
  const chains=wallChains(walls);
  assert.equal(chains.flat().length,walls.length,'every wall run belongs to a wall line');
  for(const chain of chains) {
    const widths=[...new Set(chain.map(thickness))];
    assert.ok(Math.max(...widths)-Math.min(...widths)<=1,
      `runs joined end to end on one wall line share a thickness: ${JSON.stringify(chain.map(run=>run.slice(0,4)))} use ${widths.join('/')} px`);
  }
}

// ---- perimeter closure ----
// Every outline edge is covered by a wall footprint, an opening span or a perpendicular wall. The
// near-miss at z=940 between x=900 and x=970 is closed only by the thickness of
// [900,935,970,935,17], whose footprint reaches z=943.5.
{
  const openingRects=[...doors,...windows].map(([x1,z1,x2,z2,options])=>{
    const horizontal=z1===z2,t=options?.depth??12;
    return horizontal?[x1,z1-t/2,x2,z1+t/2]:[x1-t/2,z1,x1+t/2,z2];
  });
  const inRect=([x,z],[a,b,c,d])=>x>=a-EPS&&x<=c+EPS&&z>=b-EPS&&z<=d+EPS;
  let samples=0;const gaps=[];
  for(let i=0;i<outline.length;i++) {
    const [ax,az]=outline[i],[bx,bz]=outline[(i+1)%outline.length];
    const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.5));
    for(let k=0;k<=steps;k++) {
      const x=ax+(bx-ax)*k/steps,z=az+(bz-az)*k/steps;samples++;
      if(!footprints.some(rect=>inRect([x,z],rect))&&!openingRects.some(rect=>inRect([x,z],rect)))
        gaps.push([Math.round(x*100)/100,Math.round(z*100)/100]);
    }
  }
  assert.ok(samples>7000,`the outline is sampled densely (${samples} points)`);
  assert.equal(gaps.length,0,`every outline edge is closed by walls or openings; first uncovered points ${JSON.stringify(gaps.slice(0,12))}`);
}

// ---- rooms tile the outline ----
{
  assert.deepEqual(rooms.map(room=>room.id),EXPECTED_ROOMS,'plan.js exports the nine expected rooms in order');
  for(const room of rooms) {
    assert.ok(inside(room.point[0],room.point[1],outline),`${room.id} spawn point is inside the apartment`);
    assert.ok(inside(room.point[0],room.point[1],room.poly),`${room.id} spawn point is inside its own room polygon`);
    for(const [x,z] of room.poly)
      assert.ok(inside(x,z,outline)||distanceToOutline(x,z)<1e-6,`${room.id} polygon vertex ${x},${z} is inside the outline or on its boundary`);
  }
  // Half-integer-free sampling: every polygon edge coordinate is an integer, so no sample lands on
  // an edge and shared boundaries cannot count twice.
  const xs=outline.map(point=>point[0]),zs=outline.map(point=>point[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const step=2,off=.37;
  let cells=0,uncovered=0,overlaps=0;
  for(let x=minX+off;x<maxX;x+=step)for(let z=minZ+off;z<maxZ;z+=step) {
    if(!inside(x,z,outline))continue;
    cells++;
    const hits=rooms.filter(room=>inside(x,z,room.poly)).length;
    if(hits>1)overlaps++;else if(hits===0)uncovered++;
  }
  assert.equal(overlaps,0,`no sampled floor cell lies in two room polygons (${cells} cells at a ${step} px grid)`);
  // Measured: 10038 of 174000 (5.8%) uncovered at this grid. They are the interior wall faces
  // between rooms, the outline margin, the 5 px living/kitchen drafting sliver at x 820-825 and the
  // 1 px guest/utility sliver at x 630-631. Bound 12000 keeps 20% headroom; losing any room polygon
  // adds at least 9187 cells (the guest bathroom is the smallest), so a dropped room fails.
  assert.ok(uncovered<=12000,`uncovered floor cells stay at wall-thickness scale: ${uncovered} of ${cells}`);
}

// ---- jamb alignment ----
// Every door/window endpoint lies on a wall centreline, on a wall face, or on the end of a wall
// run. The flush door endpoint (570,868) is 2 px off the [460,870,570,870,12] centreline but exactly
// on that run's end face, which is what the plan intends.
for(const [x1,z1,x2,z2,options] of [...doors,...windows]) {
  const id=options?.id??options?.style??'door';
  for(const [px,pz] of [[x1,z1],[x2,z2]]) {
    let aligned=false;
    for(const [a,b,c,d,t=12] of walls) {
      const horizontal=b===d;
      const along=horizontal?px:pz,lo=horizontal?Math.min(a,c):Math.min(b,d),hi=horizontal?Math.max(a,c):Math.max(b,d);
      const perp=horizontal?pz-b:px-a;
      if(along<lo-EPS||along>hi+EPS||Math.abs(perp)>t/2+EPS)continue;
      if(Math.abs(perp)<EPS||Math.abs(Math.abs(perp)-t/2)<EPS||Math.abs(along-lo)<EPS||Math.abs(along-hi)<EPS){aligned=true;break;}
    }
    assert.ok(aligned,`${id} jamb ${px},${pz} sits on a wall centreline, face or run end`);
  }
}

// ---- furniture footprint rules ----
const square=[[0,0],[10,0],[10,10],[0,10]];
assert.ok(fitsFurniture([1,1,3,3],[],square),'Clear footprint is accepted');
assert.ok(!fitsFurniture([-1,1,3,3],[],square),'Partly outside footprint is rejected');
assert.ok(!fitsFurniture([11,1,13,3],[],square),'Fully outside footprint is rejected');
assert.ok(!fitsFurniture([1,1,5,5],[[3,0,4,10]],square),'Wall crossing the middle of a footprint is rejected');
assert.ok(!fitsFurniture([1,1,5,5],[[2,2,3,3]],square),'Enclosed column is rejected');
assert.ok(fitsFurniture([1,1,3,3],[[3,0,4,10]],square),'Touching a wall without overlap is allowed');
const notched=[[0,0],[10,0],[10,10],[6,10],[6,4],[4,4],[4,10],[0,10]];
assert.ok(!fitsFurniture([2,2,8,8],[],notched),'Concave notch is rejected even with all corners inside');

// ---------------------------------------------------------------------------------------------
// Browser checks. Run npm start first. Uses the installed Chrome; CHROME_PATH can select another
// Chromium executable.
// ---------------------------------------------------------------------------------------------
// The single test surface the harness binds to. Every hook throws
// "check.mjs hooks are stale: <name> ..." when the app internals it reads are missing or have
// moved, so a scan that matches nothing fails loudly instead of looking like success.
const HOOKS_SOURCE=`
  const testStale=(name,detail)=>{throw new Error('check.mjs hooks are stale: '+name+(detail?' ('+detail+')':''));};
  const named=(group,suffix)=>group.children.filter(o=>typeof o.name==='string'&&o.name.endsWith(suffix));
  let shadowUpdates=0;
  const renderShadows=renderer.shadowMap.render.bind(renderer.shadowMap);
  renderer.shadowMap.render=(...args)=>{
    if(renderer.shadowMap.enabled&&(renderer.shadowMap.autoUpdate||renderer.shadowMap.needsUpdate))shadowUpdates++;
    return renderShadows(...args);
  };
  window.testHooks={
    renderCheck:()=>({frames:renderer.info.render.frame,pending:frameId,shadows:shadowUpdates}),
    toMetres:(x,z)=>[X(x),Z(z)],
    assetsCheck:()=>{
      const maps=new Set();
      scene.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())
        for(const key of ['map','bumpMap','roughnessMap','normalMap','alphaMap'])if(m&&m[key])maps.add(m[key]);});
      const list=[...maps],loaded=list.filter(t=>t.image&&(t.image.naturalWidth>0||t.image.width>0));
      return {total:list.length,loaded:loaded.length,pending:list.filter(t=>!loaded.includes(t)).length};
    },
    openingCheck:()=>{
      const open=windows.filter(w=>!w[4].open),frames=named(glazing,'-window');
      if(frames.length!==open.length)testStale('openingCheck','expected '+open.length+' -window frames in glazing, found '+frames.length);
      const sills=named(architecture,'-sill');
      if(sills.length!==windows.length)testStale('openingCheck','expected '+windows.length+' -sill meshes in architecture, found '+sills.length);
      const balcony=glazing.getObjectByName('balcony-door');
      if(!balcony)testStale('openingCheck','balcony-door leaf missing from glazing');
      return {
        panes:Object.fromEntries(frames.map(o=>[o.name,o.children.filter(c=>c.name==='pane').length])),
        sills:Object.fromEntries(sills.map(o=>[o.name,o.geometry.parameters.height])),
        entryBlocked:!canStand(X(270),Z(826)),
        balconyClear:canStand(X(859),Z(950)),
        balconyAngle:balcony.rotation.y
      };
    },
    photoView:(id)=>{
      const views={living:[660,495,670,270],daughter:[860,300,1020,520],
        'master-north':[1240,540,1239,270],'master-east':[1150,450,1390,450],
        study:[1110,700,1112,875],bath:[1288,735,1440,714],guest:[598,961,600,1095],
        utility:[780,953,775,1095],entrance:[440,824,270,826],balcony:[853,780,859,935]};
      const view=views[id];
      if(!view)testStale('photoView','no camera for view '+id);
      setMode('walk');
      const [x,z,tx,tz]=view;
      camera.position.set(X(x),1.6,Z(z));camera.lookAt(X(tx),{guest:1.8,bath:1.65,utility:1.6}[id]??1.35,Z(tz));requestRender();
    },
    stoolCheck:()=>{
      const model=studyStool.children[0];
      if(!model)testStale('stoolCheck','studyStool has no model child');
      if(studyStool.userData.layoutId===undefined)testStale('stoolCheck','studyStool.userData.layoutId missing');
      const bounds=new THREE.Box3().setFromObject(model);
      const maps=new Set();model.traverse(o=>{if(o.isMesh)for(const m of [o.material].flat())if(m.map)maps.add(m.map);});
      if(!maps.size)testStale('stoolCheck','study stool meshes carry no texture maps');
      return {size:bounds.getSize(new THREE.Vector3()).toArray(),bottom:bounds.min.y,
        parts:model.children.length,maps:maps.size,ready:[...maps].every(map=>map.image?.naturalWidth>0),
        blocked:!canStand(studyStool.position.x,studyStool.position.z),id:studyStool.userData.layoutId};
    },
    stool2Check:()=>{
      const model=daughterStool.children[0];
      if(!model)testStale('stool2Check','daughterStool has no model child');
      const daughter=rooms.find(r=>r.id==='daughter');
      if(!daughter)testStale('stool2Check','daughter room missing from plan.js');
      const bounds=new THREE.Box3().setFromObject(model);
      return {size:bounds.getSize(new THREE.Vector3()).toArray(),bottom:bounds.min.y,parts:model.children.length,name:model.name,
        textured:model.children.every(o=>[o.material].flat().every(m=>m.map?.isCanvasTexture&&m.bumpMap?.isCanvasTexture)),
        inRoom:fitsFurniture([unX(bounds.min.x),unZ(bounds.min.z),unX(bounds.max.x),unZ(bounds.max.z)],placementWalls,daughter.poly),
        blocked:!canStand(daughterStool.position.x,daughterStool.position.z)};
    },
    stoolPreview:(second=false)=>{
      const preview=new THREE.Scene();preview.background=new THREE.Color('#dedbd5');preview.environment=scene.environment;
      preview.add((second?daughterStool:studyStool).children[0].clone(),new THREE.HemisphereLight('#fff4e8','#827a70',2));
      const light=new THREE.DirectionalLight('#fff6e9',2);light.position.set(-1,2,1);preview.add(light);
      light.castShadow=true;Object.assign(light.shadow.camera,{left:-1,right:1,top:1,bottom:-1,near:.1,far:5});
      light.shadow.mapSize.set(1024,1024);light.shadow.normalBias=.002;
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#dedbd5',roughness:1}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.001;floor.receiveShadow=true;preview.add(floor);
      const view=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.01,10);
      view.position.set(.68,.70,.85);view.lookAt(0,.23,0);renderer.shadowMap.needsUpdate=true;renderer.render(preview,view);
    },
    stoolInRoom:(second=false)=>{
      setMode('walk',rooms.find(r=>r.id===(second?'daughter':'study')));
      camera.position.set(X(second?871:1094),1.2,Z(second?510:841));
      camera.lookAt((second?daughterStool:studyStool).position.clone().add(new THREE.Vector3(0,.23,0)));requestRender();
    },
    furnitureCheck:()=>furniture.map(object=>{
      if(!Array.isArray(object.userData.colliders))testStale('furnitureCheck','furniture colliders missing');
      const bounds=new THREE.Box3().setFromObject(object);
      const point=new THREE.Vector3(object.position.x,bounds.max.y,object.position.z).project(camera);
      return {valid:fitsFurniture([unX(bounds.min.x),unZ(bounds.min.z),unX(bounds.max.x),unZ(bounds.max.z)],placementWalls),screen:{x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2},
        position:object.position.toArray(),angle:object.rotation.y,parts:object.children.map(child=>child.getWorldPosition(new THREE.Vector3()).toArray()),
        colliders:object.userData.colliders.map(bounds=>[...bounds])};
    }),
    furnitureCamera:()=>{orbit.enableDamping=false;orbit.update();camera.position.set(orbit.target.x,22,orbit.target.z+.001);orbit.update();orbit.enableDamping=true;camera.updateMatrixWorld(true);},
    dropPoint:(x,z)=>{
      const p=new THREE.Vector3(X(x),0,Z(z)).sub(furnitureDrag.offset).project(camera);
      return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};
    },
    layoutCheck:()=>furniture.map(object=>[object.position.toArray(),[object.rotation.y],...object.userData.colliders]
      .map(values=>values.map(value=>Math.round(value*1e9)/1e9))),
    cameraCheck:()=>({position:camera.position.toArray(),enabled:orbit.enabled,dragging:!!furnitureDrag}),
    checkWallEdges:()=>{
      if(cornerLines.parent!==architecture)testStale('checkWallEdges','cornerLines moved out of architecture');
      if(openingLines.parent!==overhead)testStale('checkWallEdges','openingLines moved out of overhead');
      if(cornerLines.geometry.attributes.position.count===0)testStale('checkWallEdges','cornerLines has no points');
      if(openingLines.geometry.attributes.position.count===0)testStale('checkWallEdges','openingLines has no points');
      if(architecture.children.filter(o=>o.isMesh).length===0)testStale('checkWallEdges','architecture has no wall meshes');
      return [cornerLines,openingLines].every(e=>e.material.depthTest&&!e.material.depthWrite&&e.renderOrder===1)&&
        architecture.children.filter(o=>o.isMesh).every(o=>o.children.length===0);
    },
    screenshotColours:async(base64)=>{
      const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
      const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
      const canvas=document.createElement('canvas');
      canvas.width=bitmap.width;canvas.height=bitmap.height;
      const context=canvas.getContext('2d',{willReadFrequently:true});
      context.drawImage(bitmap,0,0);
      const {data}=context.getImageData(0,0,bitmap.width,bitmap.height);
      const colours=new Set();
      for(let i=0;i<data.length;i+=4*17)colours.add((data[i]<<16)|(data[i+1]<<8)|data[i+2]);
      return colours.size;
    },
    blockRoomSpawn:(roomId)=>{
      const room=rooms.find(r=>r.id===roomId);
      if(!room)testStale('blockRoomSpawn','no room '+roomId+' in plan.js');
      const x=X(room.point[0]),z=Z(room.point[1]);
      for(let i=0;i<furniture.length;i++) {
        placeFurniture(furniture[i],new THREE.Vector3(x,0,z),0);
        if(!canStand(x,z))return {index:i,id:furniture[i].userData.layoutId,count:furniture.length};
      }
      return {index:-1,count:furniture.length};
    },
    touchFurniture:()=>{
      const object=furniture[0];
      if(!object||!object.children[0])testStale('touchFurniture','furniture[0] has no model child');
      const p=object.children[0].getWorldPosition(new THREE.Vector3()).project(camera);
      return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,angle:object.rotation.y};
    }
  };
`;
const HOOK_NAMES=['renderCheck','toMetres','assetsCheck','openingCheck','photoView','stoolCheck','stool2Check','stoolPreview','stoolInRoom','furnitureCheck','furnitureCamera','dropPoint','layoutCheck','cameraCheck','checkWallEdges','screenshotColours','blockRoomSpawn','touchFurniture'];
async function assertHooks(target) {
  const missing=await target.evaluate(names=>{
    const hooks=window.testHooks;
    return !hooks?names.slice():names.filter(name=>typeof hooks[name]!=='function');
  },HOOK_NAMES);
  assert.deepEqual(missing,[],`check.mjs hooks are stale: ${missing.join(', ')} missing`);
}
const injectHooks=async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:await response.text()+HOOKS_SOURCE});
};

// Page errors, failed responses and console errors/warnings are collected for both pages and
// asserted at the end. Only noise the run provably produces for a benign reason is allowlisted.
const errors=[];
const BENIGN=[
  // The suite deliberately writes malformed furniture JSON and reloads; app.js handles it and says so.
  /^console\.warning: Unable to restore furniture positions/
];
const watchPage=target=>{
  target.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
  target.on('response',response=>{if(response.status()>=400)errors.push(`HTTP ${response.status()} ${response.url()}`);});
  target.on('console',message=>{
    const type=message.type();
    if(type==='error'||type==='warning')errors.push(`console.${type}: ${message.text()}`);
  });
};

await fetch('http://127.0.0.1:4173/').catch(()=>{console.error('No server on 127.0.0.1:4173. Run `npm start` in another terminal first.');process.exit(1);});
// A failure before a screenshot must not leave the previous run's image for a reviewer.
await mkdir('artifacts',{recursive:true});
for(const name of await readdir('artifacts'))if(name.endsWith('.png'))await rm(`artifacts/${name}`);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try {
  const page=await browser.newPage({viewport:{width:1536,height:1000},deviceScaleFactor:1});
  await page.route('**/app.js',injectHooks);
  watchPage(page);
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.testHooks,{timeout:60000});
  await assertHooks(page);
  // Textures load asynchronously; wait for them instead of sleeping, and name the stragglers.
  await page.waitForFunction(()=>{const assets=window.testHooks.assetsCheck();return assets.total>0&&assets.loaded===assets.total;},{timeout:30000}).catch(async()=>{
    const assets=await page.evaluate(()=>window.testHooks.assetsCheck());
    assert.fail(`scene textures did not finish loading: ${assets.loaded}/${assets.total} (${assets.pending} pending); see the HTTP error list`);
  });
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>window.testHooks.renderCheck().pending===0);
  assert.equal(await page.evaluate(()=>apartment.revision),'187');
  assert.ok(await page.evaluate(()=>apartment.drawCalls)>100);
  assert.ok(await page.evaluate(()=>testHooks.checkWallEdges()),'Joined corner and opening lines replace individual block outlines');
  const openings=await page.evaluate(()=>testHooks.openingCheck());
  assert.deepEqual(openings.panes,{'living-window':3,'daughter-window':2,'master-north-window':3,
    'master-east-window':4,'bath-window':2,'guest-window':2,'study-window':2},'Photo panel counts; utility has no glazing');
  assert.equal(openings.sills['utility-sill'],1.22,'Open balcony keeps its protective parapet');
  assert.equal(openings.sills['study-sill'],1.185,'Study window is above a raised sill');
  assert.ok(openings.entryBlocked&&openings.balconyClear,'Closed entrance blocks movement; open balcony door permits it');
  assert.equal(openings.balconyAngle,Math.PI/2,'Balcony leaf is open into the utility room');
  await page.waitForFunction(()=>testHooks.stoolCheck().ready);
  const stool=await page.evaluate(()=>testHooks.stoolCheck());
  for(const [i,size] of [.35,.45,.35].entries())assert.ok(Math.abs(stool.size[i]-size)<1e-6,'Stool matches supplied measurements in metres');
  assert.ok(Math.abs(stool.bottom)<1e-6,'Stool feet touch the floor');
  assert.equal(stool.parts,9,'Notched seat, four corner posts and four aprons');
  assert.ok(stool.maps>0,'Study stool keeps its supplied texture maps');
  assert.ok(stool.blocked,'Stool blocks walking');assert.equal(stool.id,'1157,797','Replaces the Study chair');
  const stool2=await page.evaluate(()=>testHooks.stool2Check());
  for(const [i,size] of [.35,.45,.35].entries())assert.ok(Math.abs(stool2.size[i]-size)<1e-6,'Imported stool retains its dimensions');
  assert.ok(Math.abs(stool2.bottom)<1e-6&&stool2.inRoom&&stool2.blocked,'Stool2 is on the daughter room floor with collision bounds');
  assert.equal(stool2.name,'stool2');assert.equal(stool2.parts,13,'Imported seat, legs, aprons and underside brackets');
  assert.ok(stool2.textured,'Imported procedural color and bump maps are present');
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await mkdir('artifacts',{recursive:true});
  // Every saved screenshot is decoded in-page and must contain real shading, not a blank frame.
  const shot=async(target,path)=>{
    const buffer=await target.screenshot({path});
    const colours=await page.evaluate(base64=>testHooks.screenshotColours(base64),buffer.toString('base64'));
    assert.ok(colours>=SCREENSHOT_MIN_COLOURS,`${path} is blank or single-colour: ${colours} distinct sampled colours (floor ${SCREENSHOT_MIN_COLOURS})`);
    return colours;
  };
  for(const id of ['living','daughter','master-north','master-east','study','bath','guest','utility','entrance','balcony']) {
    await page.evaluate(id=>{document.body.classList.add('clean-view');testHooks.photoView(id);},id);
    await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
    await shot(page,`artifacts/photo-${id}.png`);
  }
  await page.evaluate(()=>document.body.classList.remove('clean-view'));
  await page.locator('#overview').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await page.evaluate(()=>{document.body.classList.add('clean-view');testHooks.stoolPreview();});
  await shot(page.locator('#viewport canvas'),'artifacts/stool.png');
  await page.evaluate(()=>document.body.classList.remove('clean-view'));
  await page.locator('#reset').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await page.evaluate(()=>testHooks.stoolInRoom());await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await shot(page,'artifacts/stool-study.png');
  await page.locator('#overview').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await page.evaluate(()=>{document.body.classList.add('clean-view');testHooks.stoolPreview(true);});
  await shot(page.locator('#viewport canvas'),'artifacts/stool2.png');
  await page.evaluate(()=>document.body.classList.remove('clean-view'));
  await page.evaluate(()=>testHooks.stoolInRoom(true));await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await shot(page,'artifacts/stool2-daughter.png');
  await page.locator('#overview').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  const idle=await page.evaluate(()=>testHooks.renderCheck());
  await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(()=>testHooks.renderCheck()),idle,'Idle overview schedules no frames or shadows');
  await page.mouse.move(1000,140);await page.mouse.down();await page.mouse.move(1040,160,{steps:4});await page.mouse.up();
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  const orbited=await page.evaluate(()=>testHooks.renderCheck());
  assert.ok(orbited.frames>idle.frames,'Orbit renders and settles');
  assert.equal(orbited.shadows,idle.shadows,'Camera motion reuses cached shadows');
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>testHooks.renderCheck()),orbited,'Orbit damping stops scheduling frames');
  await page.locator('#light').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>testHooks.renderCheck())).frames>orbited.frames,'Lighting change redraws');
  assert.equal((await page.evaluate(()=>testHooks.renderCheck())).shadows,orbited.shadows,'Intensity change reuses shadows');
  await page.locator('#light').click();
  await page.locator('#walls').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>testHooks.renderCheck())).shadows>orbited.shadows,'Wall change refreshes shadows');
  await page.locator('#walls').click();await page.locator('#reset').click();
  await page.locator('#clean').click();
  assert.equal(await page.locator('body').evaluate(body=>body.classList.contains('clean-view')),true,'Clean view hides the HUD');
  assert.equal(await page.locator('#clean').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('header').isVisible(),false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('body').evaluate(body=>body.classList.contains('clean-view')),false,'Escape restores the HUD');
  assert.equal(await page.locator('#clean').getAttribute('aria-pressed'),'false');
  await page.locator('#edit').click();
  assert.equal(await page.locator('body').evaluate(body=>body.classList.contains('clean-view')),true,'Edit mode enters Clean View');
  assert.equal(await page.locator('#edit').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#clean span').textContent(),'Finish editing');
  await page.locator('#clean').click();
  assert.equal(await page.locator('#edit').getAttribute('aria-pressed'),'false','Finish editing prevents accidental furniture moves');
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('resize'));
  });
  const hidden=await page.evaluate(()=>testHooks.renderCheck());
  assert.equal(hidden.pending,0,'Hidden tab does not schedule a frame');
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>testHooks.renderCheck()),hidden,'Hidden tab stays idle');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>testHooks.renderCheck())).frames>hidden.frames,'Returning to the tab redraws');
  const reachable=await page.evaluate(()=>{
    const step=.08,minX=-7.1,minZ=-4.6,width=177,height=126;
    const clear=new Uint8Array(width*height),seen=new Uint8Array(width*height);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++)clear[z*width+x]=apartment.canStand(minX+x*step,minZ+z*step);
    const cell=point=>{const [mx,mz]=testHooks.toMetres(point[0],point[1]);return Math.round((mz-minZ)/step)*width+Math.round((mx-minX)/step);};
    const queue=[cell(apartment.rooms[0].point)];seen[queue[0]]=1;
    for(let i=0;i<queue.length;i++) {
      const a=queue[i],x=a%width,z=Math.floor(a/width);
      for(const [nx,nz] of [[x-1,z],[x+1,z],[x,z-1],[x,z+1]]) {
        const b=nz*width+nx;
        if(nx>=0&&nx<width&&nz>=0&&nz<height&&clear[b]&&!seen[b]){seen[b]=1;queue.push(b);}
      }
    }
    return apartment.rooms.filter(r=>!seen[cell(r.point)]).map(r=>r.id);
  });
  assert.deepEqual(reachable,[],'Every room is reachable on foot from the living room');
  await mkdir('artifacts',{recursive:true});
  await shot(page,'artifacts/overview.png');
  // The room inventory is pinned: the plan, the buttons and the caption must agree.
  assert.deepEqual(await page.locator('#rooms button').evaluateAll(buttons=>buttons.map(button=>button.dataset.room)),EXPECTED_ROOMS,'The room panel lists exactly the nine expected rooms in plan order');
  assert.equal(await page.locator('#rooms button').count(),EXPECTED_ROOMS.length,'The room panel has one button per room');
  let previousCaption=null;
  for(const room of rooms) {
    assert.ok(inside(...room.point),`${room.id} is inside the apartment`);
    assert.ok(await page.evaluate(([x,z])=>apartment.canStand(x,z),[X(room.point[0]),Z(room.point[1])]),`${room.id} spawn is clear`);
    await page.locator(`button[data-room="${room.id}"]`).click();
    assert.equal(await page.evaluate(()=>apartment.room),room.id);
    const caption=await page.locator('#room-name').textContent();
    assert.equal(caption,room.name,`#room-name captions the ${room.id} spawn`);
    if(previousCaption!==null)assert.notEqual(caption,previousCaption,`#room-name changes between spawns (${previousCaption} -> ${caption})`);
    previousCaption=caption;
  }
  await page.locator('button[data-room="living"]').click();
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  const walkIdle=await page.evaluate(()=>testHooks.renderCheck());
  await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(()=>testHooks.renderCheck()),walkIdle,'Idle walking view renders no frames');
  await page.locator('#viewport canvas').dispatchEvent('pointerdown',{clientX:800,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointermove',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointerup',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  const before=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
  const after=await page.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.2,'W walks forward');
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)));
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  assert.equal((await page.evaluate(()=>testHooks.renderCheck())).shadows,walkIdle.shadows,'Walking and looking reuse shadows');
  // Regression: a HUD button keeps keyboard focus after its click; movement keys must still work.
  const focusCases=[
    ['light',async()=>{await page.locator('#light').click();},async()=>{await page.locator('#light').click();}],
    ['help',async()=>{await page.locator('#help').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));},async()=>{}],
    ['clean',async()=>{await page.locator('#clean').click();},async()=>{await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.body.classList.contains('clean-view'));}]
  ];
  for(const [id,enter,leave] of focusCases) {
    await page.locator('button[data-room="living"]').click();
    await enter();
    assert.equal(await page.evaluate(()=>document.activeElement?.id??document.activeElement?.tagName),id,`#${id} holds focus before W is pressed`);
    const focusBefore=await page.evaluate(()=>apartment.position);
    await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');
    const focusAfter=await page.evaluate(()=>apartment.position);
    const moved=Math.hypot(focusAfter.x-focusBefore.x,focusAfter.z-focusBefore.z);
    assert.ok(moved>.2,`W still walks after #${id} takes focus (moved ${moved.toFixed(3)} m)`);
    await leave();
  }
  await page.locator('button[data-room="living"]').click();
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await shot(page,'artifacts/living.png');
  await page.locator('#light').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await shot(page,'artifacts/evening.png');
  await page.locator('button[data-room="kitchen"]').click();
  const kitchenStart=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(2200);await page.keyboard.up('w');
  const kitchenEnd=await page.evaluate(()=>apartment.position);
  assert.ok(kitchenEnd.x-kitchenStart.x>.2&&kitchenEnd.x-kitchenStart.x<.55,'Kitchen counter stops continuous forward motion');
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)));
  for(const id of ['master','daughter','bath','study']) {
    await page.locator(`button[data-room="${id}"]`).click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
    await shot(page,`artifacts/${id}.png`);
  }
  await page.locator('#help').click();assert.ok(await page.locator('#help-dialog').isVisible());
  await page.keyboard.press('Escape');
  await page.locator('#overview').click();assert.equal(await page.evaluate(()=>apartment.mode),'overview');
  await page.locator('#walls').click();assert.equal(await page.locator('#walls').getAttribute('aria-pressed'),'true');
  await page.locator('#walls').click();await page.locator('#light').click();
  await page.evaluate(()=>testHooks.furnitureCamera());
  const locked=await page.evaluate(()=>testHooks.furnitureCheck()[0]);
  await page.mouse.move(locked.screen.x,locked.screen.y);await page.mouse.down();await page.mouse.move(locked.screen.x-10,locked.screen.y-6);await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>testHooks.furnitureCheck()[0].position),locked.position,'Furniture stays fixed outside Edit mode');
  await page.locator('#edit').click();
  // Clear orbit inertia left by the preceding non-edit drag before measuring furniture-only motion.
  await page.evaluate(()=>testHooks.furnitureCamera());
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  const count=await page.evaluate(()=>testHooks.furnitureCheck().length);
  assert.equal(count,14,'Three chairs, three stools, a bench, two desks and five tables are movable');
  for(let i=0;i<count;i++) {
    const before=await page.evaluate(i=>testHooks.furnitureCheck()[i],i);
    assert.ok(before.valid,`Furniture ${i} starts clear of walls`);
    const cameraBefore=await page.evaluate(()=>testHooks.cameraCheck().position);
    const shadowsBefore=(await page.evaluate(()=>testHooks.renderCheck())).shadows;
    await page.mouse.move(before.screen.x,before.screen.y);await page.mouse.down();
    assert.equal(await page.evaluate(()=>testHooks.cameraCheck().dragging),true,`Furniture ${i} is picked`);
    await page.mouse.move(before.screen.x-10,before.screen.y-6,{steps:4});
    await page.mouse.up();
    await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
    assert.ok((await page.evaluate(()=>testHooks.renderCheck())).shadows>shadowsBefore,'Moving furniture refreshes shadows');
    const after=await page.evaluate(i=>testHooks.furnitureCheck()[i],i);
    const dx=after.position[0]-before.position[0],dz=after.position[2]-before.position[2];
    assert.ok(Math.hypot(dx,dz)>.1,`Furniture ${i} moves`);
    assert.equal(after.position[1],before.position[1],'Furniture stays on the floor');
    for(let j=0;j<before.parts.length;j++) {
      assert.ok(Math.abs(after.parts[j][0]-before.parts[j][0]-dx)<1e-8);
      assert.ok(Math.abs(after.parts[j][2]-before.parts[j][2]-dz)<1e-8);
    }
    for(let j=0;j<before.colliders.length;j++)for(let k=0;k<4;k++)
      assert.ok(Math.abs(after.colliders[j][k]-before.colliders[j][k]-(k%2?dz:dx))<1e-8,'Walking bounds follow furniture');
    const cameraAfter=await page.evaluate(()=>testHooks.cameraCheck().position);
    assert.ok(cameraAfter.every((value,i)=>Math.abs(value-cameraBefore[i])<1e-9),`Dragging furniture ${i} does not orbit: ${cameraBefore} -> ${cameraAfter}`);
    assert.equal(await page.evaluate(()=>testHooks.cameraCheck().enabled),true,'Orbit resumes on release');
    await page.mouse.down();await page.mouse.move(before.screen.x,before.screen.y,{steps:4});await page.mouse.up();
  }
  for(const [x,z] of [[400,400],[807,400],[680,280],[515,910]]) {
    const before=await page.evaluate(()=>testHooks.furnitureCheck()[0]);
    await page.mouse.move(before.screen.x,before.screen.y);await page.mouse.down();
    const target=await page.evaluate(([x,z])=>testHooks.dropPoint(x,z),[x,z]);
    await page.mouse.move(target.x,target.y);await page.keyboard.press('Space');
    assert.notDeepEqual((await page.evaluate(()=>testHooks.furnitureCheck()[0])).position,before.position,'Invalid destination is previewed while dragging');
    await page.mouse.up();
    assert.deepEqual(await page.evaluate(()=>testHooks.furnitureCheck()[0]),before,'Invalid drop restores the entire object and collision bounds');
  }
  const item=await page.evaluate(()=>testHooks.furnitureCheck()[0]);
  await page.mouse.move(item.screen.x,item.screen.y);await page.mouse.down();
  await page.locator('#viewport canvas').dispatchEvent('pointercancel',{pointerId:1});
  assert.equal(await page.evaluate(()=>testHooks.cameraCheck().dragging),false,'Cancelled drag is cleared');
  assert.equal(await page.evaluate(()=>testHooks.cameraCheck().enabled),true,'Cancelled drag restores orbit');
  await page.mouse.up();
  await page.locator('#clean').click();await page.locator('#reset').click();
  const defaultLayout=await page.evaluate(()=>testHooks.layoutCheck());
  await page.evaluate(()=>testHooks.furnitureCamera());
  await page.locator('#edit').click();
  const desk=await page.evaluate(()=>testHooks.furnitureCheck()[11]); // Bedroom desk against its wall
  await page.mouse.move(desk.screen.x,desk.screen.y);await page.mouse.down();
  await page.keyboard.press('Space');await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Rotation alone cannot turn a desk into a wall');
  const table=await page.evaluate(()=>testHooks.furnitureCheck()[3]);
  await page.mouse.move(table.screen.x,table.screen.y);await page.mouse.down();
  for(let turn=0;turn<4;turn++)await page.keyboard.press('Space');
  await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Four quarter turns restore the original orientation');
  for(const i of [0,4,3]) {
    const item=await page.evaluate(i=>testHooks.furnitureCheck()[i],i);
    await page.mouse.move(item.screen.x,item.screen.y);await page.mouse.down();
    await page.mouse.move(item.screen.x-10,item.screen.y-6);
    await page.keyboard.down('Space');
    const angle=await page.evaluate(i=>testHooks.furnitureCheck()[i].angle,i);
    assert.ok(Math.abs(angle-(item.angle+Math.PI/2)%(Math.PI*2))<1e-9,'Space rotates 90 degrees');
    await page.keyboard.down('Space');
    assert.equal(await page.evaluate(i=>testHooks.furnitureCheck()[i].angle,i),angle,'Holding Space does not repeat rotation');
    await page.keyboard.up('Space');await page.mouse.up();
  }
  const savedLayout=await page.evaluate(()=>testHooks.layoutCheck());
  assert.notDeepEqual(savedLayout[0],defaultLayout[0],'Table moves before saving');
  assert.notDeepEqual(savedLayout[4],defaultLayout[4],'Chair moves before saving');
  const originalBounds=defaultLayout[3][2],rotatedBounds=savedLayout[3][2];
  assert.ok(Math.abs((rotatedBounds[2]-rotatedBounds[0])-(originalBounds[3]-originalBounds[1]))<1e-8,'Rotated table swaps collision width and depth');
  await page.locator('#clean').click();await page.locator('#walk').click();await page.locator('#overview').click();
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),savedLayout,'Changing views preserves furniture');
  await page.reload();await page.waitForFunction(()=>window.testHooks);
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),savedLayout,'Reload restores furniture and walking bounds');
  await page.locator('#reset').click();
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Reset view restores defaults');
  await page.reload();await page.waitForFunction(()=>window.testHooks);
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Reset persists across reload');
  await page.evaluate(()=>localStorage.setItem('f-residence-furniture-v1','{broken'));
  await page.reload();await page.waitForFunction(()=>window.testHooks);
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Malformed saved JSON is ignored');
  await page.locator('#reset').click();
  await page.evaluate(([outsideX,outsideZ])=>{
    const key='f-residence-furniture-v1',saved=JSON.parse(localStorage.getItem(key)),ids=Object.keys(saved);
    for(const id of ids)saved[id]=[1e100,1e100];
    saved[ids[0]]=[outsideX,outsideZ];
    saved[ids[1]]=['bad',0];
    localStorage.setItem(key,JSON.stringify(saved));
  },[X(820),Z(400)]);
  await page.reload();await page.waitForFunction(()=>window.testHooks);
  assert.deepEqual(await page.evaluate(()=>testHooks.layoutCheck()),defaultLayout,'Invalid types and placements are ignored');
  await page.locator('#reset').click();
  await page.reload();await page.waitForFunction(()=>window.testHooks);
  // Regression: furniture dropped exactly on a room's spawn point must not freeze walking there.
  const blocked=await page.evaluate(()=>testHooks.blockRoomSpawn('living'));
  assert.ok(blocked.index>=0,`one furniture piece can be dropped on the living spawn to block it (tried ${blocked.count})`);
  await page.locator('button[data-room="living"]').click();
  const spawnX=X(rooms[0].point[0]),spawnZ=Z(rooms[0].point[1]);
  const spawned=await page.evaluate(()=>apartment.position);
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)),'A blocked room spawn still places the camera on a standable cell');
  const nudge=Math.hypot(spawned.x-spawnX,spawned.z-spawnZ);
  assert.ok(nudge>0&&nudge<=2.5,`A blocked spawn steps aside instead of teleporting into furniture (${nudge.toFixed(2)} m; freeSpawn searches up to 2.4 m)`);
  const spawnWalkBefore=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(400);await page.keyboard.up('w');
  const spawnWalkAfter=await page.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(spawnWalkAfter.x-spawnWalkBefore.x,spawnWalkAfter.z-spawnWalkBefore.z)>.2,'W still walks after spawning beside blocking furniture');
  await page.locator('#reset').click();
  await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.waitForFunction(()=>testHooks.renderCheck().pending===0);
  await shot(page,'artifacts/mobile.png');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await mobile.route('**/app.js',injectHooks);
  watchPage(mobile);
  await mobile.goto('http://127.0.0.1:4173');await mobile.waitForFunction(()=>window.testHooks);
  await assertHooks(mobile);
  const cdp=await mobile.context().newCDPSession(mobile);
  await mobile.locator('#edit').tap();
  const touchBefore=await mobile.evaluate(()=>testHooks.touchFurniture());
  for(let i=0;i<2;i++) {
    const target=await mobile.evaluate(()=>testHooks.touchFurniture());
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x,y:target.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const touchAfter=await mobile.evaluate(()=>testHooks.touchFurniture());
  assert.ok(Math.abs(touchAfter.angle-(touchBefore.angle+Math.PI/2)%(Math.PI*2))<1e-9,'Double-tap rotates furniture 90 degrees');
  await mobile.locator('#clean').tap();
  await mobile.locator('#walk').tap();
  assert.ok(await mobile.locator('#touch-controls').isVisible());
  const mobileStart=await mobile.evaluate(()=>apartment.position);
  const pad=await mobile.locator('[data-move="forward"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width/2,y:pad.y+pad.height/2}]});
  await mobile.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const mobileEnd=await mobile.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(mobileEnd.x-mobileStart.x,mobileEnd.z-mobileStart.z)>.2,'Touch pad moves the camera');
  const mobileBuffer=await mobile.screenshot({path:'artifacts/mobile-walk.png'});
  const mobileColours=await mobile.evaluate(base64=>testHooks.screenshotColours(base64),mobileBuffer.toString('base64'));
  assert.ok(mobileColours>=SCREENSHOT_MIN_COLOURS,`artifacts/mobile-walk.png is blank or single-colour: ${mobileColours} distinct sampled colours (floor ${SCREENSHOT_MIN_COLOURS})`);
  const unexpected=errors.filter(error=>!BENIGN.some(pattern=>pattern.test(error)));
  assert.deepEqual(unexpected,[],`page errors, failed responses or console errors/warnings:\n  ${unexpected.join('\n  ')}`);
  if(errors.length)console.log(`Allowed benign page noise (${errors.length}): ${[...new Set(errors)].join(' | ')}`);
  console.log('PASS: plan data (window depths and flanking walls, joined wall thickness, perimeter closure, T-junction corners, room tiling, jamb alignment), Three.js r187, opening frames and sills, room reachability, every room spawn with its caption, idle rendering and shadow caching, non-blank screenshots, keyboard focus and blocked-spawn regressions, furniture dragging, keyboard walking, solid collisions, lighting, walls, dialogs, HTTP/console cleanliness, mobile layout and real touch movement.');
} finally {await browser.close();}
