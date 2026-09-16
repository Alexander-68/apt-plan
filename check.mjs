import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { rooms, X, Z, inside, fitsFurniture } from './plan.js';
import { mkdir } from 'node:fs/promises';
import { wallCorners, cornerSpan } from './wall-edges.js';

assert.deepEqual(wallCorners([[0,0,4,1],[0,0,1,4]]),[[0,0],[0,4],[4,0],[4,1],[1,1],[1,4]],'L junction has outer and inner corners without block seams');
assert.deepEqual(wallCorners([[0,0,2,1],[2,0,4,1]]),[[0,0],[0,1],[4,0],[4,1]],'Straight wall joins have no corner lines');
assert.deepEqual(cornerSpan(3,1,[[2,0,4,0]],[],1),[0,2.25],'Door jamb stops at header');
assert.deepEqual(cornerSpan(1,1,[[2,0,4,0]],[],1),[0,2.8],'Adjacent room corner stays full height');

const square=[[0,0],[10,0],[10,10],[0,10]];
assert.ok(fitsFurniture([1,1,3,3],[],square),'Clear footprint is accepted');
assert.ok(!fitsFurniture([-1,1,3,3],[],square),'Partly outside footprint is rejected');
assert.ok(!fitsFurniture([11,1,13,3],[],square),'Fully outside footprint is rejected');
assert.ok(!fitsFurniture([1,1,5,5],[[3,0,4,10]],square),'Wall crossing the middle of a footprint is rejected');
assert.ok(!fitsFurniture([1,1,5,5],[[2,2,3,3]],square),'Enclosed column is rejected');
assert.ok(fitsFurniture([1,1,3,3],[[3,0,4,10]],square),'Touching a wall without overlap is allowed');
const notched=[[0,0],[10,0],[10,10],[6,10],[6,4],[4,4],[4,10],[0,10]];
assert.ok(!fitsFurniture([2,2,8,8],[],notched),'Concave notch is rejected even with all corners inside');

// Run npm start first. Uses the installed Chrome; CHROME_PATH can select another Chromium executable.
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try {
  const page=await browser.newPage({viewport:{width:1536,height:1000},deviceScaleFactor:1});
  await page.route('**/app.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`
      let shadowUpdates=0;
      const renderShadows=renderer.shadowMap.render.bind(renderer.shadowMap);
      renderer.shadowMap.render=(...args)=>{
        if(renderer.shadowMap.enabled&&(renderer.shadowMap.autoUpdate||renderer.shadowMap.needsUpdate))shadowUpdates++;
        return renderShadows(...args);
      };
      window.renderCheck=()=>({frames:renderer.info.render.frame,pending:frameId,shadows:shadowUpdates});
      window.furnitureCheck=()=>furniture.map(object=>{
        const bounds=new THREE.Box3().setFromObject(object);
        const point=new THREE.Vector3(object.position.x,bounds.max.y,object.position.z).project(camera);
        return {valid:fitsFurniture([bounds.min.x/SCALE+850,bounds.min.z/SCALE+650,bounds.max.x/SCALE+850,bounds.max.z/SCALE+650],placementWalls),screen:{x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2},
          position:object.position.toArray(),angle:object.rotation.y,parts:object.children.map(child=>child.getWorldPosition(new THREE.Vector3()).toArray()),
          colliders:object.userData.colliders.map(bounds=>[...bounds])};
      });
      window.furnitureCamera=()=>{orbit.enableDamping=false;orbit.update();camera.position.set(orbit.target.x,22,orbit.target.z+.001);orbit.update();orbit.enableDamping=true;camera.updateMatrixWorld(true);};
      window.dropPoint=(x,z)=>{
        const p=new THREE.Vector3(X(x),0,Z(z)).sub(furnitureDrag.offset).project(camera);
        return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};
      };
      window.layoutCheck=()=>furniture.map(object=>[object.position.toArray(),[object.rotation.y],...object.userData.colliders]
        .map(values=>values.map(value=>Math.round(value*1e9)/1e9)));
      window.cameraCheck=()=>({position:camera.position.toArray(),enabled:orbit.enabled,dragging:!!furnitureDrag});
      window.checkWallEdges=()=>{
        return cornerLines.parent===architecture&&openingLines.parent===overhead&&
          [cornerLines,openingLines].every(e=>e.geometry.attributes.position.count>0&&
            e.material.depthTest&&!e.material.depthWrite&&e.renderOrder===1)&&
          architecture.children.filter(o=>o.isMesh).every(o=>o.children.length===0);
      };
    `});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.apartment,{timeout:60000});
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>apartment.revision),'185');
  assert.ok(await page.evaluate(()=>apartment.meshes)>100);
  assert.ok(await page.evaluate(()=>checkWallEdges()),'Joined corner and opening lines replace individual block outlines');
  await page.waitForFunction(()=>renderCheck().pending===0);
  const idle=await page.evaluate(()=>renderCheck());
  await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(()=>renderCheck()),idle,'Idle overview schedules no frames or shadows');
  await page.mouse.move(1000,140);await page.mouse.down();await page.mouse.move(1040,160,{steps:4});await page.mouse.up();
  await page.waitForFunction(()=>renderCheck().pending===0);
  const orbited=await page.evaluate(()=>renderCheck());
  assert.ok(orbited.frames>idle.frames,'Orbit renders and settles');
  assert.equal(orbited.shadows,idle.shadows,'Camera motion reuses cached shadows');
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>renderCheck()),orbited,'Orbit damping stops scheduling frames');
  await page.locator('#light').click();await page.waitForFunction(()=>renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>renderCheck())).frames>orbited.frames,'Lighting change redraws');
  assert.equal((await page.evaluate(()=>renderCheck())).shadows,orbited.shadows,'Intensity change reuses shadows');
  await page.locator('#light').click();
  await page.locator('#walls').click();await page.waitForFunction(()=>renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>renderCheck())).shadows>orbited.shadows,'Wall change refreshes shadows');
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
  assert.equal(await page.locator('#clean span').textContent,'Finish editing');
  await page.locator('#clean').click();
  assert.equal(await page.locator('#edit').getAttribute('aria-pressed'),'false','Finish editing prevents accidental furniture moves');
  await page.waitForFunction(()=>renderCheck().pending===0);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('resize'));
  });
  const hidden=await page.evaluate(()=>renderCheck());
  assert.equal(hidden.pending,0,'Hidden tab does not schedule a frame');
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>renderCheck()),hidden,'Hidden tab stays idle');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>renderCheck().pending===0);
  assert.ok((await page.evaluate(()=>renderCheck())).frames>hidden.frames,'Returning to the tab redraws');
  const reachable=await page.evaluate(()=>{
    const step=.08,minX=-7.1,minZ=-4.6,width=177,height=126;
    const clear=new Uint8Array(width*height),seen=new Uint8Array(width*height);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++)clear[z*width+x]=apartment.canStand(minX+x*step,minZ+z*step);
    const cell=point=>Math.round(((point[1]-650)*(1.88/160)-minZ)/step)*width+Math.round(((point[0]-850)*(1.88/160)-minX)/step);
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
  await page.screenshot({path:'artifacts/overview.png'});
  for(const room of rooms) {
    assert.ok(inside(...room.point),`${room.id} is inside the apartment`);
    assert.ok(await page.evaluate(([x,z])=>apartment.canStand(x,z),[X(room.point[0]),Z(room.point[1])]),`${room.id} spawn is clear`);
    await page.locator(`button[data-room="${room.id}"]`).click();
    assert.equal(await page.evaluate(()=>apartment.room),room.id);
  }
  await page.locator('button[data-room="living"]').click();
  await page.waitForFunction(()=>renderCheck().pending===0);
  const walkIdle=await page.evaluate(()=>renderCheck());
  await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(()=>renderCheck()),walkIdle,'Idle walking view renders no frames');
  await page.locator('#viewport canvas').dispatchEvent('pointerdown',{clientX:800,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointermove',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointerup',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  const before=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
  const after=await page.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.2,'W walks forward');
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)));
  await page.waitForFunction(()=>renderCheck().pending===0);
  assert.equal((await page.evaluate(()=>renderCheck())).shadows,walkIdle.shadows,'Walking and looking reuse shadows');
  await page.screenshot({path:'artifacts/living.png'});
  await page.locator('#light').click();await page.waitForTimeout(300);
  await page.screenshot({path:'artifacts/evening.png'});
  await page.locator('button[data-room="kitchen"]').click();
  const kitchenStart=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(2200);await page.keyboard.up('w');
  const kitchenEnd=await page.evaluate(()=>apartment.position);
  assert.ok(kitchenEnd.x-kitchenStart.x>.2&&kitchenEnd.x-kitchenStart.x<.55,'Kitchen counter stops continuous forward motion');
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)));
  for(const id of ['master','daughter','bath','study']) {
    await page.locator(`button[data-room="${id}"]`).click();await page.waitForTimeout(100);
    await page.screenshot({path:`artifacts/${id}.png`});
  }
  await page.locator('#source').click();assert.ok(await page.locator('#plan-dialog').isVisible());
  await page.locator('#plan-dialog [data-close]').click();
  await page.locator('#help').click();assert.ok(await page.locator('#help-dialog').isVisible());
  await page.keyboard.press('Escape');
  await page.locator('#overview').click();assert.equal(await page.evaluate(()=>apartment.mode),'overview');
  await page.locator('#walls').click();assert.equal(await page.locator('#walls').getAttribute('aria-pressed'),'true');
  await page.locator('#walls').click();await page.locator('#light').click();
  await page.evaluate(()=>furnitureCamera());
  const locked=await page.evaluate(()=>furnitureCheck()[0]);
  await page.mouse.move(locked.screen.x,locked.screen.y);await page.mouse.down();await page.mouse.move(locked.screen.x-10,locked.screen.y-6);await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>furnitureCheck()[0].position),locked.position,'Furniture stays fixed outside Edit mode');
  await page.locator('#edit').click();
  await page.waitForFunction(()=>renderCheck().pending===0);
  const count=await page.evaluate(()=>furnitureCheck().length);
  assert.equal(count,15,'All six chairs, two desks and seven tables are movable');
  for(let i=0;i<count;i++) {
    const before=await page.evaluate(i=>furnitureCheck()[i],i);
    assert.ok(before.valid,`Furniture ${i} starts clear of walls`);
    const cameraBefore=await page.evaluate(()=>cameraCheck().position);
    const shadowsBefore=(await page.evaluate(()=>renderCheck())).shadows;
    await page.mouse.move(before.screen.x,before.screen.y);await page.mouse.down();
    assert.equal(await page.evaluate(()=>cameraCheck().dragging),true,`Furniture ${i} is picked`);
    await page.mouse.move(before.screen.x-10,before.screen.y-6,{steps:4});
    await page.mouse.up();
    await page.waitForFunction(()=>renderCheck().pending===0);
    assert.ok((await page.evaluate(()=>renderCheck())).shadows>shadowsBefore,'Moving furniture refreshes shadows');
    const after=await page.evaluate(i=>furnitureCheck()[i],i);
    const dx=after.position[0]-before.position[0],dz=after.position[2]-before.position[2];
    assert.ok(Math.hypot(dx,dz)>.1,`Furniture ${i} moves`);
    assert.equal(after.position[1],before.position[1],'Furniture stays on the floor');
    for(let j=0;j<before.parts.length;j++) {
      assert.ok(Math.abs(after.parts[j][0]-before.parts[j][0]-dx)<1e-8);
      assert.ok(Math.abs(after.parts[j][2]-before.parts[j][2]-dz)<1e-8);
    }
    for(let j=0;j<before.colliders.length;j++)for(let k=0;k<4;k++)
      assert.ok(Math.abs(after.colliders[j][k]-before.colliders[j][k]-(k%2?dz:dx))<1e-8,'Walking bounds follow furniture');
    assert.ok((await page.evaluate(()=>cameraCheck().position)).every((value,i)=>Math.abs(value-cameraBefore[i])<1e-9),'Dragging furniture does not orbit');
    assert.equal(await page.evaluate(()=>cameraCheck().enabled),true,'Orbit resumes on release');
    await page.mouse.down();await page.mouse.move(before.screen.x,before.screen.y,{steps:4});await page.mouse.up();
  }
  for(const [x,z] of [[400,400],[807,400],[680,280],[515,910]]) {
    const before=await page.evaluate(()=>furnitureCheck()[0]);
    await page.mouse.move(before.screen.x,before.screen.y);await page.mouse.down();
    const target=await page.evaluate(([x,z])=>dropPoint(x,z),[x,z]);
    await page.mouse.move(target.x,target.y);await page.keyboard.press('Space');
    assert.notDeepEqual((await page.evaluate(()=>furnitureCheck()[0])).position,before.position,'Invalid destination is previewed while dragging');
    await page.mouse.up();
    assert.deepEqual(await page.evaluate(()=>furnitureCheck()[0]),before,'Invalid drop restores the entire object and collision bounds');
  }
  const item=await page.evaluate(()=>furnitureCheck()[0]);
  await page.mouse.move(item.screen.x,item.screen.y);await page.mouse.down();
  await page.locator('#viewport canvas').dispatchEvent('pointercancel',{pointerId:1});
  assert.equal(await page.evaluate(()=>cameraCheck().dragging),false,'Cancelled drag is cleared');
  assert.equal(await page.evaluate(()=>cameraCheck().enabled),true,'Cancelled drag restores orbit');
  await page.mouse.up();
  await page.locator('#clean').click();await page.locator('#reset').click();
  const defaultLayout=await page.evaluate(()=>layoutCheck());
  await page.evaluate(()=>furnitureCamera());
  await page.locator('#edit').click();
  const desk=await page.evaluate(()=>furnitureCheck()[13]);
  await page.mouse.move(desk.screen.x,desk.screen.y);await page.mouse.down();
  await page.keyboard.press('Space');await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Rotation alone cannot turn a desk into a wall');
  const table=await page.evaluate(()=>furnitureCheck()[3]);
  await page.mouse.move(table.screen.x,table.screen.y);await page.mouse.down();
  for(let turn=0;turn<4;turn++)await page.keyboard.press('Space');
  await page.mouse.up();
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Four quarter turns restore the original orientation');
  for(const i of [0,4,3]) {
    const item=await page.evaluate(i=>furnitureCheck()[i],i);
    await page.mouse.move(item.screen.x,item.screen.y);await page.mouse.down();
    await page.mouse.move(item.screen.x-10,item.screen.y-6);
    await page.keyboard.down('Space');
    const angle=await page.evaluate(i=>furnitureCheck()[i].angle,i);
    assert.ok(Math.abs(angle-(item.angle+Math.PI/2)%(Math.PI*2))<1e-9,'Space rotates 90 degrees');
    await page.keyboard.down('Space');
    assert.equal(await page.evaluate(i=>furnitureCheck()[i].angle,i),angle,'Holding Space does not repeat rotation');
    await page.keyboard.up('Space');await page.mouse.up();
  }
  const savedLayout=await page.evaluate(()=>layoutCheck());
  assert.notDeepEqual(savedLayout[0],defaultLayout[0],'Table moves before saving');
  assert.notDeepEqual(savedLayout[4],defaultLayout[4],'Chair moves before saving');
  const originalBounds=defaultLayout[3][2],rotatedBounds=savedLayout[3][2];
  assert.ok(Math.abs((rotatedBounds[2]-rotatedBounds[0])-(originalBounds[3]-originalBounds[1]))<1e-8,'Rotated table swaps collision width and depth');
  await page.locator('#clean').click();await page.locator('#walk').click();await page.locator('#overview').click();
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),savedLayout,'Changing views preserves furniture');
  await page.reload();await page.waitForFunction(()=>window.apartment);
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),savedLayout,'Reload restores furniture and walking bounds');
  await page.locator('#reset').click();
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Reset view restores defaults');
  await page.reload();await page.waitForFunction(()=>window.apartment);
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Reset persists across reload');
  await page.evaluate(()=>localStorage.setItem('f-residence-furniture-v1','{broken'));
  await page.reload();await page.waitForFunction(()=>window.apartment);
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Malformed saved JSON is ignored');
  await page.locator('#reset').click();
  await page.evaluate(()=>{
    const key='f-residence-furniture-v1',saved=JSON.parse(localStorage.getItem(key)),ids=Object.keys(saved);
    for(const id of ids)saved[id]=[1e100,1e100];
    saved[ids[0]]=[(820-850)*1.88/160,(400-650)*1.88/160];
    saved[ids[1]]=['bad',0];
    localStorage.setItem(key,JSON.stringify(saved));
  });
  await page.reload();await page.waitForFunction(()=>window.apartment);
  assert.deepEqual(await page.evaluate(()=>layoutCheck()),defaultLayout,'Invalid types and placements are ignored');
  await page.locator('#reset').click();
  await page.reload();await page.waitForFunction(()=>window.apartment);
  await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.waitForTimeout(300);
  await page.screenshot({path:'artifacts/mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await mobile.route('**/app.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+`\nwindow.touchFurniture=()=>{const object=furniture[0],p=object.children[0].getWorldPosition(new THREE.Vector3()).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2,angle:object.rotation.y};};`});
  });
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto('http://127.0.0.1:4173');await mobile.waitForFunction(()=>window.apartment);
  const cdp=await mobile.context().newCDPSession(mobile);
  await mobile.locator('#edit').tap();
  const touchBefore=await mobile.evaluate(()=>touchFurniture());
  for(let i=0;i<2;i++) {
    const target=await mobile.evaluate(()=>touchFurniture());
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:target.x,y:target.y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const touchAfter=await mobile.evaluate(()=>touchFurniture());
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
  await mobile.screenshot({path:'artifacts/mobile-walk.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: idle rendering and shadow caching, Three.js r185, 9 connected rooms, furniture dragging, keyboard walking, solid collisions, lighting, walls, dialogs, mobile layout and real touch movement.');
} finally {await browser.close();}
