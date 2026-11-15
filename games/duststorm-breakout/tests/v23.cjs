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
  save.settings.sound=false;save.settings.shake=false;save.settings.horde=true;
  save.unlocked=5;save.up=[3,3,3,3,3,3];save.ownedVehicles=[0,1,2,3,4,5,6];
  const tests={};
  // 1) 版本与 v23 快照端点
  tests.version=window.DustRun.version==='2.3.0'&&!!window.DustRun.snapshot().v23;
  // 2) 尸潮波次：非新手段定时投放追击者
  save.selected=2;save.fieldKit='scout';startRun();
  horde.timer=0;run.elapsed=30;updateHorde(1/120);
  tests.hordeWave=horde.wave===1&&zombies.filter(z=>z.horde&&!z.hit).length>=2;
  // 3) 新手保护段（第一区前 1700）不投放
  save.selected=0;startRun();car.x=800;horde.timer=0;updateHorde(1/120);
  tests.hordeNewbieQuiet=zombies.filter(z=>z.horde&&!z.hit).length===0;
  // 4) 撕咬：低速贴身掉装甲
  save.selected=2;startRun();horde.timer=999;
  zombies.push({id:777001,x:car.x+20,y:ground(car.x),scale:1.2,phase:0,skin:'#959a72',shirt:'#905b4d',hit:false,walk:0,variant:'runner',horde:true});
  const hp0=car.hp;car.vx=0;
  for(let i=0;i<360;i++){run.elapsed+=1/120;updateHorde(1/120);}
  tests.hordeBite=car.hp<hp0-5;
  // 5) 低压模式：关闭后不投放、不撕咬（2.2 行为）
  save.settings.horde=false;startRun();horde.timer=0;const hp1=car.hp;
  zombies.push({id:777002,x:car.x+20,y:ground(car.x),scale:1.2,phase:0,skin:'#959a72',shirt:'#905b4d',hit:false,walk:0,variant:'runner',horde:true});
  car.vx=0;for(let i=0;i<120;i++){run.elapsed+=1/120;updateHorde(1/120);}
  tests.hordeQuietOff=horde.wave===0&&car.hp===hp1;
  save.settings.horde=true;
  // 6) 投石者：预警圈 → 抛掷 → 落地爆炸
  save.selected=2;startRun();horde.timer=999;
  const lx=car.x+700;
  zombies.push({id:777010,x:lx,y:ground(lx),scale:1.2,phase:0,skin:'#959a72',shirt:'#6a4b52',hit:false,walk:0,variant:'lobber'});
  updateMutants(1/120);
  zombies.find(z=>z.id===777010).throwAt=-5;run.elapsed=1;updateMutants(1/120);
  tests.lobberMark=mutantMarks.length===1;
  run.elapsed+=1;updateMutants(1/120);
  tests.lobberShot=mutantShots.length===1;
  const ex0=run.explosions;
  for(let i=0;i<140&&mutantShots.length;i++){run.elapsed+=1/120;updateMutants(1/120);}
  tests.lobberBoom=run.explosions>ex0&&mutantShots.length===0;
  // 7) 尖啸者：动员周围普通感染者为疾行者（清场保证配额与对象确定性）
  save.selected=2;startRun();horde.timer=999;zombies=[];
  const sx2=car.x+400;
  zombies.push({id:777020,x:sx2,y:ground(sx2),scale:1.2,phase:0,skin:'#c9a292',shirt:'#8a4f63',hit:false,walk:0,variant:'screamer'});
  zombies.push({id:777021,x:sx2+60,y:ground(sx2+60),scale:1.2,phase:0,skin:'#959a72',shirt:'#555e50',hit:false,walk:0,variant:'normal'});
  zombies.push({id:777022,x:sx2+120,y:ground(sx2+120),scale:1.2,phase:0,skin:'#959a72',shirt:'#555e50',hit:false,walk:0,variant:'normal'});
  run.elapsed=5;zombies.find(z=>z.id===777020).convertAt=0.001;updateMutants(1/120);
  tests.screamerConvert=zombies.filter(z=>(z.id===777021||z.id===777022)&&z.variant==='runner').length===2;
  // 8) 尸巢：生成 + 冲撞三击清除
  save.selected=0;startRun();horde.timer=999;
  tests.nestPlaced=nests.length>=2;
  const n0=nests[0];
  for(let h=0;h<3;h++){car.x=n0.x;car.y=n0.y-30;car.vx=80;car.angle=0;run.elapsed+=0.6;updateMutants(1/120);}
  tests.nestRamClear=n0.dead&&run.nestsCleared===1;
  // 9) 尸巢：爆炸清除
  startRun();
  const n1=nests.find(n=>!n.dead),c1=run.nestsCleared;
  explode(n1.x,n1.y-25,135,1,'environment');
  tests.nestBlastClear=n1.dead&&run.nestsCleared===c1+1;
  // 10) 防线 Boss：生成
  save.selected=2;startRun();
  tests.bossBuilt=!!boss&&boss.x===routes[2].len-850&&boss.hp===100&&!boss.defeated&&boss.platforms.length>=8;
  // 11) 防线 Boss：爆炸拆塔 + 清障
  for(let i=0;i<8&&!boss.defeated;i++)explode(boss.x,ground(boss.x)-150,160,1.5,'player');
  tests.bossDefeat=boss.defeated&&run.bossDefeated===1&&boss.platforms.every(p=>p.destroyed);
  // 12) 防线 Boss：守卫波
  save.selected=3;startRun();
  car.x=boss.x-300;car.y=ground(car.x)-65;boss.guardTimer=0.01;
  const guardsBefore=zombies.filter(z=>z.bossGuard&&!z.hit).length;
  updateBoss(0.02);
  tests.bossGuards=zombies.filter(z=>z.bossGuard&&!z.hit).length>guardsBefore;
  // 13) 无尽远征：启动、流式延伸、过期清理
  endlessPending=true;save.selected=0;startRun();
  tests.endlessStart=run.endless===true&&boss===null&&routes[0].len===2000000;
  const gen0=endlessGen.generatedTo;
  car.x=gen0-3000;updateEndless(1/120);
  tests.endlessStream=endlessGen.generatedTo===gen0+2800&&terrain[terrain.length-1].x===endlessGen.generatedTo;
  car.x+=20000;
  for(let i=0;i<400;i++){updateEndless(1/120);updateHorde(1/120);}
  tests.endlessCull=endlessGen.generatedTo>gen0+20000&&zombies.length<500&&platforms.filter(p=>p.x2<car.x-3200&&!p.destroyed).length===0;
  // 14) 无尽远征：纪录结算 + 普通远征恢复路线长度
  run.distance=25000;run.kills=40;finish('QA');
  tests.endlessRecord=save.endlessBest.dist===2083&&save.fieldStats.endlessDist===2083&&state==='result';
  endlessPending=false;startRun();
  tests.lenRestored=routes[0].len===18000&&!run.endless&&!!boss;
  // 15) 委托链：一步完成后下发二步，二步达标入账
  save.runs=0;save.fieldKit='scout';startRun();
  tests.chainSwap=field.contracts.every(c=>!c.step2)&&field.contracts.map(c=>c.id).join()==='distance,combo,rescue';
  run.distance=7200;run.maxCombo=12;run.rescues=1;updateField(1/120);
  tests.chainStep1=field.completed.includes('distance')&&field.contracts.some(c=>c.id==='distance+2');
  const cashAfterStep1=field.cash;updateField(1/120);
  tests.chainNoDouble=field.cash===cashAfterStep1;
  run.distance=13000;updateField(1/120);
  tests.chainStep2=field.completed.includes('distance+2')&&field.cash>=cashAfterStep1+420;
  // 16) 统计落库：防线击破计入生存档案
  save.selected=2;startRun();
  const st0=save.fieldStats.bosses;
  for(let i=0;i<8&&!boss.defeated;i++)explode(boss.x,ground(boss.x)-150,160,1.5,'player');
  finish('QA');
  tests.bossStat=save.fieldStats.bosses===st0+1;
  return {tests};
 });
 const shot=async name=>{await page.screenshot({path:path.join(root,'previews',name+'.png')});};
 await page.evaluate(()=>{save.selected=2;save.settings.horde=true;startRun();horde.timer=0;run.elapsed=30;updateHorde(1/120);updateHorde(1/120);car.x=600;car.y=ground(600)-65;car.vx=200;camera.x=car.x-250;camera.y=car.y-60;run.elapsed=35;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('run-23-horde');
 await page.evaluate(()=>{save.selected=2;startRun();car.x=boss.x-720;car.y=ground(car.x)-65;camera.x=car.x+250;camera.y=car.y-140;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('run-23-boss');
 await page.evaluate(()=>{endlessPending=true;save.selected=0;startRun();for(let i=0;i<4;i++){car.x=endlessGen.generatedTo-3100;updateEndless(1/120);}car.x=endlessGen.generatedTo-2200;car.y=ground(car.x)-65;camera.x=car.x+250;camera.y=car.y-80;updateHUD();ctx.setTransform(DPR,0,0,DPR,0,0);renderRun(0);});await shot('run-23-endless');
 await page.evaluate(()=>{garage();ctx.setTransform(DPR,0,0,DPR,0,0);renderGarageScene();});await page.click('#openField');
 await page.evaluate(()=>{document.querySelector('#startEndless').scrollIntoView({block:'center'});});
 await shot('field-23-endless-entry');
 const report={errors,...logic};
 fs.writeFileSync(path.join(root,'tests/v23-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 await browser.close();
 if(errors.length||Object.values(logic.tests).some(v=>!v))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
