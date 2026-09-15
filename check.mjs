import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { rooms, X, Z, inside } from './plan.js';
import { mkdir } from 'node:fs/promises';

// Run npm start first. Uses the installed Chrome; CHROME_PATH can select another Chromium executable.
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try {
  const page=await browser.newPage({viewport:{width:1536,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.apartment,{timeout:60000});
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>apartment.revision),'185');
  assert.ok(await page.evaluate(()=>apartment.meshes)>100);
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
  await page.locator('#viewport canvas').dispatchEvent('pointerdown',{clientX:800,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointermove',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  await page.locator('#viewport canvas').dispatchEvent('pointerup',{clientX:820,clientY:400,pointerId:1,pointerType:'mouse'});
  const before=await page.evaluate(()=>apartment.position);
  await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');
  const after=await page.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.2,'W walks forward');
  assert.ok(await page.evaluate(()=>apartment.canStand(apartment.position.x,apartment.position.z)));
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
  await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.waitForTimeout(300);
  await page.screenshot({path:'artifacts/mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto('http://127.0.0.1:4173');await mobile.waitForFunction(()=>window.apartment);
  await mobile.locator('#walk').tap();
  assert.ok(await mobile.locator('#touch-controls').isVisible());
  const mobileStart=await mobile.evaluate(()=>apartment.position);
  const pad=await mobile.locator('[data-move="forward"]').boundingBox();
  const cdp=await mobile.context().newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width/2,y:pad.y+pad.height/2}]});
  await mobile.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const mobileEnd=await mobile.evaluate(()=>apartment.position);
  assert.ok(Math.hypot(mobileEnd.x-mobileStart.x,mobileEnd.z-mobileStart.z)>.2,'Touch pad moves the camera');
  await mobile.screenshot({path:'artifacts/mobile-walk.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: Three.js r185, 9 connected rooms, keyboard walking, solid collisions, lighting, walls, dialogs, mobile layout and real touch movement.');
} finally {await browser.close();}
