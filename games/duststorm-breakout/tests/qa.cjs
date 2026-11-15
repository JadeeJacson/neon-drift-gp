const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=f=>{window.nextFrame=f;return 1};});
 await page.goto('file://'+root+'/index.html');
 await page.waitForTimeout(150);
 const logic=await page.evaluate(()=>{
  save.settings.sound=false;save.settings.shake=false;const tests={};
  tests.version=window.DustRun.version==='2.3.0';
  save.unlocked=5;save.up=[3,3,3,3,3,3];save.ownedVehicles=[0,1,2,3,4,5,6];
  const maps=[];
  for(let stage=0;stage<6;stage++){save.selected=stage;startRun();maps.push({stage,structures:platforms.length,pickups:field.pickups.length,rescues:field.rescues.length,gates:field.gates.length,weather:field.weather.name,specials:zombies.filter(z=>z.variant!=='normal').length});}
  tests.allMaps=maps.every(m=>m.structures>200&&m.pickups>10&&m.rescues>1&&m.gates>1&&m.specials>0);
  save.selected=0;save.fieldKit='scout';startRun();tests.scoutFuel=Math.abs(car.maxFuel-(26+3*8.5)*fleet[save.vehicle].fuel*1.15)<1e-7;
  let pick=field.pickups[0];pick.type='fuel';car.fuel=0;car.x=pick.x;car.y=pick.y;updateField(1/120);tests.fuelPickup=pick.taken&&car.fuel===7.5&&run.supplies===1;updateField(1/120);tests.singlePickup=run.supplies===1;
  let rescue=field.rescues[0];car.x=rescue.x;car.y=rescue.y-55;car.vx=0;for(let i=0;i<145;i++)updateField(1/120);tests.rescueDone=rescue.done&&run.rescues===1;let money=field.cash;updateField(2);tests.singleRescue=run.rescues===1&&field.cash>=money;
  startRun();rescue=field.rescues[0];car.x=rescue.x;car.y=rescue.y-55;car.vx=200;updateField(2);tests.fastNoRescue=!rescue.done;
  let gate=field.gates[0];car.x=gate.x+1;car.vx=500;updateField(1/120);tests.speedGate=gate.done&&run.speedGates===1;updateField(1);tests.singleGate=run.speedGates===1;
  startRun();let z=zombies.find(z=>z.variant==='armored');car.vx=150;hitZombie(z);tests.armorFirstHit=!z.hit&&!z.armorIntact;hitZombie(z);tests.armorCooldown=!z.hit;run.elapsed+=1;hitZombie(z);tests.armorSecondHit=z.hit;
  z=zombies.find(z=>z.variant==='armored'&&!z.hit);car.vx=500;hitZombie(z);tests.armorHighSpeed=z.hit;
  z=zombies.find(z=>z.variant==='armored'&&!z.hit);hitContext={x:z.x,y:z.y,speed:200};hitZombie(z);hitContext=null;tests.armorMissile=z.hit;
  z=zombies.find(z=>z.variant==='volatile'&&!z.hit);const q=field.fuses.length;hitZombie(z);tests.volatileFuse=field.fuses.length===q+1;car.x=0;run.elapsed+=1;const before=run.explosions;updateField(1/120);tests.volatileExplosion=run.explosions>before;
  save.fieldKit='breach';startRun();car.shield=0;const hp=car.hp;damageCar(10,'explosion');tests.breachDamage=Math.abs(hp-car.hp-7.2)<1e-6;launchMissile();tests.breachMissile=rockets.length>0&&rockets[0].radius>100;
  save.fieldKit='stunt';startRun();tests.stuntCapacity=car.maxBoost>(3.5+save.up[4]*1.25)*boostSpec().duration;const hp2=car.hp;damageCar(10,'landing');tests.stuntLanding=Math.abs(hp2-car.hp-5.85)<1e-6;
  save.runs=0;save.fieldKit='scout';startRun();run.distance=7200;run.maxCombo=12;run.rescues=1;run.supplies=3;updateField(1/120);tests.contractComplete=field.completed.includes('distance')&&field.completed.includes('combo')&&field.completed.includes('rescue');let cash=field.cash;updateField(1/120);tests.singleContract=field.cash===cash;
  const wallet=save.money,stats=JSON.stringify(save.fieldStats);finish('QA');tests.payout=save.money>wallet&&state==='result'&&field.settled;tests.badges=save.fieldBadges.includes('firstAid');const after=save.money;finish('QA');tests.singlePayout=save.money===after;
  const savedBadge=save.fieldBadges.length;startRun();run.rescues=1;finish('QA');tests.singleBadge=save.fieldBadges.length===savedBadge;
  // Physical regression inherited from 2.1.
  save.selected=0;startRun();
  function setup(){platforms=[];blastQueue=[];props=[];zombies=[];collapseDebris=[];car.x=1000;car.y=ground(1000)-60;car.angle=0;car.vy=0;car.vx=0;const p=addPlatform(1000,1155,car.y-150,car.y-150,'scaffold');Object.assign(p,{bottom:ground(1000),group:99,level:0});return p;}
  let p=setup();car.vx=60;impactStructures(1/120);tests.structureSlow=p.hp>0;
  p=setup();car.vx=700;impactStructures(1/120);tests.structureRam=p.hp<=0&&car.vx>650;
  p=setup();car.x=1070;car.y=p.y1-12-car.radius;car.vx=700;impactStructures(1/120);tests.platformTravel=p.hp>0;
  p=setup();const upper=addPlatform(p.x1,p.x2,p.y1-160,p.y1-160,'scaffold');Object.assign(upper,{bottom:p.y1,group:99,level:1});const far=addPlatform(1500,1655,p.y1,p.y1,'scaffold');Object.assign(far,{bottom:ground(1500),group:99,level:0});explode(p.x1+18,ground(p.x1)-25,135,1,'environment');tests.localCollapse=p.hp<=0&&upper.hp<=0&&far.hp>0;
  const driving=[];
  for(const stage of [0,2,4,5]){save.selected=stage;save.vehicle=3;startRun();car.hp=car.maxHp=1e7;car.fuel=1e5;zombies=[];props=[];field.pickups=[];control.gas=true;for(let i=0;i<2400&&state==='run';i++)physics(1/120);driving.push({stage,x:Math.round(car.x),speed:Math.round(car.vx),finite:[car.x,car.y,car.vx,car.vy].every(Number.isFinite)});control.gas=false;}
  tests.driving=driving.every(d=>d.finite&&d.x>1000);
  save.settings.weather=false;renderRun(0);tests.weatherToggle=save.settings.weather===false;
  return {tests,maps,driving};
 });
 const shot=async name=>{await page.screenshot({path:path.join(root,'previews',name+'.png')});};
 // Stable representative views; render world explicitly because RAF is intentionally stopped.
 await page.evaluate(()=>{save.selected=0;save.vehicle=0;save.up=[0,0,0,0,0,0];save.settings.weather=true;garage();ctx.setTransform(DPR,0,0,DPR,0,0);renderGarageScene();});await shot('garage-desktop');
 await page.click('#openField');await shot('field-prep-desktop');
 await page.click('#fieldArchiveTab');await shot('field-archive-desktop');
 await page.click('#closeField');
 for(let st=0;st<6;st++){
  await page.evaluate(st=>{save.selected=st;startRun();car.x=2450;car.y=ground(car.x)-65;camera.x=car.x;camera.y=car.y;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);},st);await shot('run-'+st);
 }
 await page.evaluate(()=>{save.selected=0;startRun();const s=field.rescues[0];car.x=s.x;car.y=s.y-65;car.vx=0;s.progress=.8;camera.x=car.x;camera.y=car.y;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('rescue-desktop');
 await page.evaluate(()=>{run.rescues=1;run.supplies=4;run.specialKills=9;finish('引擎需要喘口气。');ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('result-desktop');
 const responsive=[];
 for(const [w,h,mode] of [[390,844,'portrait'],[844,390,'landscape']]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(30);
  await page.evaluate(()=>{garage();ctx.setTransform(DPR,0,0,DPR,0,0);renderGarageScene();});await shot('garage-'+mode);
  await page.click('#openField');await shot('field-prep-'+mode);
  responsive.push(await page.evaluate(()=>({page:'prep',w:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,body:document.querySelector('#fieldbook').scrollWidth>innerWidth})));
  await page.click('#fieldArchiveTab');await shot('field-archive-'+mode);await page.click('#closeField');
  await page.click('#launchBtn');
  await page.evaluate(()=>{car.x=2300;car.y=ground(car.x)-65;camera.x=car.x;camera.y=car.y;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('run-'+mode);
  await page.click('#pauseBtn');await shot('pause-'+mode);await page.click('#pauseSettingsBtn');await shot('settings-'+mode);await page.click('#closeSettings');await page.click('#resumeBtn');
  await page.evaluate(()=>{run.rescues=1;run.supplies=3;run.specialKills=6;finish('这一趟，值得。');});await shot('result-'+mode);
 }
 const report={errors,...logic,responsive};fs.writeFileSync(path.join(root,'tests/report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(errors.length||Object.values(logic.tests).some(v=>!v)||responsive.some(v=>v.overflow||v.body))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
