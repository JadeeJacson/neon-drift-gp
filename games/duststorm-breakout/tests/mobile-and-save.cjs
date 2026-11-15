const{chromium}=require('playwright'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',headless:true,args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),errors=[],checks={};p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+root+'/index.html');await p.evaluate(()=>{save.settings.sound=false;save.settings.shake=false;});
 await p.click('#openField');await p.click('[data-fieldkit="breach"]');checks.kitUI=await p.evaluate(()=>save.fieldKit==='breach');
 const downloadWait=p.waitForEvent('download');await p.click('#exportField');const download=await downloadWait;await download.saveAs(path.join(root,'tests/temporary-save.json'));const exported=JSON.parse(fs.readFileSync(path.join(root,'tests/temporary-save.json'),'utf8'));checks.export=exported.fieldKit==='breach'&&exported.version===1;
 p.on('dialog',d=>d.accept());
 await p.locator('#fieldSaveFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});await p.waitForTimeout(80);checks.badImportPreserves=await p.evaluate(()=>save.fieldKit==='breach'&&save.money===900);
 const old={version:1,money:2222,up:[1,2,0,1,0,0],unlocked:2,selected:1,best:[50,20,0],kills:45,runs:7,wins:0,settings:{sound:false,gore:true,quality:true,shake:false},vehicle:2,ownedVehicles:[0,2],armor:0,booster:0,manualLevel:2,autoLevel:1};
 await p.locator('#fieldSaveFile').setInputFiles({name:'v21.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await p.waitForTimeout(120);checks.oldImport=await p.evaluate(()=>save.money===2222&&save.unlocked===2&&save.fieldKit==='scout'&&save.up[1]===2&&save.vehicle===2);
 await p.reload();checks.reloadPersistence=await p.evaluate(()=>save.money===2222&&save.fieldKit==='scout'&&save.vehicle===2&&save.autoLevel===1);
 await p.click('#openField');await p.click('[data-fieldkit="stunt"]');await p.click('#closeField');await p.reload();checks.kitPersistence=await p.evaluate(()=>save.fieldKit==='stunt');
 // Touch dispatch verifies simultaneous gas and fire, not synthetic JS clicks.
 await p.click('#launchBtn');await p.evaluate(()=>{zombies=[];props=[];car.hp=car.maxHp=10000;});
 const cdp=await p.context().newCDPSession(p),gas=await p.locator('[data-control="gas"]').boundingBox(),fire=await p.locator('#manualFire').boundingBox();
 const touch=(a,id)=>({x:a.x+a.width/2,y:a.y+a.height/2,id});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(gas,1),touch(fire,2)]});await p.waitForTimeout(1000);
 checks.multiTouch=await p.evaluate(()=>control.gas&&run.manualShots>=1&&car.vx>20);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});checks.release=await p.evaluate(()=>!control.gas);
 // Pause freezes all expedition state.
 await p.click('#pauseBtn');const paused=await p.evaluate(()=>({elapsed:run.elapsed,cash:field.cash,fuel:car.fuel}));await p.waitForTimeout(300);checks.pause=await p.evaluate(s=>run.elapsed===s.elapsed&&field.cash===s.cash&&car.fuel===s.fuel,paused);await p.click('#resumeBtn');
 await p.evaluate(()=>{car.x=2300;car.y=ground(car.x)-65;car.vx=0;camera.x=car.x;camera.y=car.y;updateHUD();});await p.waitForTimeout(60);await p.screenshot({path:path.join(root,'previews/touch-portrait.png')});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(150);await p.screenshot({path:path.join(root,'previews/touch-landscape.png')});
 checks.visibleLandscape=await p.locator('[data-control="gas"]').isVisible();
 const overlaps=await p.evaluate(()=>{
  const ids=['[data-control="gas"]','[data-control="brake"]','[data-control="boost"]','[data-control="front"]','[data-control="back"]','#manualFire','#autoSwitch','#recoverBtn','#pauseBtn'];const a=ids.map(sel=>({sel,r:document.querySelector(sel).getBoundingClientRect()}));const pairs=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const r=a[i].r,s=a[j].r;if(Math.min(r.right,s.right)>Math.max(r.left,s.left)&&Math.min(r.bottom,s.bottom)>Math.max(r.top,s.top))pairs.push([a[i].sel,a[j].sel]);}return pairs;
 });checks.noControlOverlap=overlaps.length===0;
 // Deterministic falling pickups and final-frame reward boundaries.
 const extra=await p.evaluate(()=>{
  save.selected=4;startRun();const out={};const item=field.pickups.find(p=>p.platform!=null);if(item){const originalY=item.y;platforms[item.platform].hp=0;car.x=0;for(let i=0;i<240;i++)updateField(1/120);out.fallingPickup=item.platform===null&&item.y>originalY&&item.y<=ground(item.x)-24;}
  field.pickups=[];field.rescues=[];field.gates=[];field.fuses=[];run.kills=0;run.distance=0;
  field.contracts=[fieldContracts[1]];run.kills=35;const wallet=save.money;finish('QA');out.finalFrameContract=field.completed.includes('kills')&&save.money>=wallet+300;
  return out;
 });Object.assign(checks,extra);
 fs.rmSync(path.join(root,'tests/temporary-save.json'));const report={errors,checks,overlaps};fs.writeFileSync(path.join(root,'tests/mobile-and-save-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await b.close();if(errors.length||Object.values(checks).some(v=>!v))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
