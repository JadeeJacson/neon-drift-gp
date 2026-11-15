// DUST RUN 2.2 — Expeditions. Additive systems; vehicle physics remain in game.js.
const fieldKits = [
  {id:'scout',name:'长途侦察',code:'RANGE',desc:'燃料容量 +15% · 沿途补给效果 +25%',color:'#abd9b4'},
  {id:'breach',name:'破阵先锋',code:'BREACH',desc:'手动导弹爆炸范围 +18% · 爆炸伤害减免 20%',color:'#edbd7a'},
  {id:'stunt',name:'飞跃专家',code:'AIRBORNE',desc:'氮气容量 +25% · 落地伤害减免 35%',color:'#9ed5e4'},
];
const fieldContracts = [
  {id:'distance',name:'探路先锋',desc:'本次行驶 600 米',target:600,reward:260,value:r=>Math.floor(r.distance/12),unit:'m'},
  {id:'kills',name:'公路清道夫',desc:'本次清除 35 名感染者',target:35,reward:300,value:r=>r.kills,unit:'名'},
  {id:'supply',name:'物尽其用',desc:'本次拾取 3 份补给',target:3,reward:250,value:r=>r.supplies,unit:'份'},
  {id:'combo',name:'连续突破',desc:'本次达成 12 连杀',target:12,reward:320,value:r=>r.maxCombo,unit:'连杀'},
  {id:'break',name:'拆迁行动',desc:'本次摧毁 8 段结构',target:8,reward:350,value:r=>(r.collapses||0),unit:'段'},
  {id:'air',name:'离地时刻',desc:'本次单次滞空 1.5 秒',target:1.5,reward:280,value:r=>Math.floor(r.maxAir*10)/10,unit:'秒'},
  {id:'rescue',name:'不留一人',desc:'本次完成 1 次路边救援',target:1,reward:360,value:r=>r.rescues,unit:'次'},
  {id:'speed',name:'风沙竞速',desc:'本次通过 1 座测速门',target:1,reward:300,value:r=>r.speedGates,unit:'座'},
  {id:'special',name:'危险清除',desc:'本次清除 6 名特殊感染者',target:6,reward:330,value:r=>r.specialKills,unit:'名'},
];
const fieldBadges = [
  {id:'firstAid',name:'伸出的手',desc:'累计救援 1 人',reward:250,progress:s=>s.rescues,target:1},
  {id:'convoy',name:'没有独行者',desc:'累计救援 10 人',reward:1000,progress:s=>s.rescues,target:10},
  {id:'supplyLine',name:'补给线',desc:'累计拾取 15 份补给',reward:500,progress:s=>s.supplies,target:15},
  {id:'hunter',name:'异变猎手',desc:'累计清除 50 名特殊感染者',reward:750,progress:s=>s.specialKills,target:50},
  {id:'pilot',name:'废土飞行员',desc:'单次滞空达到 2 秒',reward:500,progress:s=>s.maxAir,target:2},
  {id:'demolition',name:'拆迁专家',desc:'累计摧毁 100 段结构',reward:800,progress:s=>s.structures,target:100},
  {id:'speedster',name:'追上风的人',desc:'累计通过 5 座测速门',reward:700,progress:s=>s.speedGates,target:5},
  {id:'contractor',name:'可靠的伙伴',desc:'累计完成 12 项委托',reward:1200,progress:s=>s.contracts,target:12},
];
const fieldWeather = [
  {name:'浮尘',kind:'dust',color:'#e2bd7b',radio:'公路视野尚可。绿色标记是补给，蓝色信号是求救。'},
  {name:'冷雨',kind:'rain',color:'#a3c6cc',radio:'城区降雨，路边有重甲感染者。保持速度，或用导弹开路。'},
  {name:'余烬',kind:'ember',color:'#f8ad6c',radio:'工厂的火还没熄。橙色背罐感染者死亡后会延迟爆炸。'},
  {name:'海雾',kind:'fog',color:'#b6d4c1',radio:'港口有薄雾。留意求救信号，减速停靠就能接人。'},
  {name:'高空风沙',kind:'dust',color:'#d9bd90',radio:'高架路线能找到弹药。离地时记得保持车身平衡。'},
  {name:'熔炉灰烬',kind:'ember',color:'#ed9a6b',radio:'终点就在反应堆后面。保存氮气，避开连锁爆炸。'},
];
let field = null, fieldTab = 'prep', weatherClock = 0;
const reducedFieldMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function normalizeField() {
  if (!fieldKits.some(k=>k.id===save.fieldKit)) save.fieldKit='scout';
  const raw=save.fieldStats||{};
  save.fieldStats=Object.fromEntries(['rescues','supplies','specialKills','structures','speedGates','contracts','maxAir','cash'].map(k=>[k,Math.max(0,Number(raw[k])||0)]));
  save.fieldBadges=Array.isArray(save.fieldBadges)?save.fieldBadges.filter(id=>fieldBadges.some(b=>b.id===id)):[];
  if(typeof save.settings.weather!=='boolean') save.settings.weather=true;
}
function contractsForRun() {
  const n=save.runs%3;
  return [fieldContracts[n],fieldContracts[3+n],fieldContracts[6+n]];
}
function fieldMessage(title,text,color='#c6dbbe') {
  if(!field)return;
  field.radio={title,text,color,until:run.elapsed+6};
}
function fieldReward(amount,label,x=car.x,y=car.y-105) {
  field.cash+=amount;
  floater(x,y,label+' +$'+amount,'#eac782');
  AudioSystem.tone(520,920,.15,.06);
}
normalizeField();
$('app').insertAdjacentHTML('beforeend', `
<section id="fieldbook" class="screen field-screen" aria-label="远征档案">
 <div class="field-shell">
  <header class="field-header"><div><div class="small">DUST RUN 2.3 / EXPEDITION</div><h2>每一趟，都有新的理由。</h2><p>选择战术，带上委托。别忘了路边仍有人在等待。</p></div><button class="field-close" id="closeField" aria-label="返回车库">返回车库 ↗</button></header>
  <nav class="field-tabs" aria-label="远征分页"><button id="fieldPrepTab">出发准备</button><button id="fieldArchiveTab">生存档案</button></nav>
  <div id="fieldBody"></div>
  <footer class="field-footer"><span>本地自动存档 · 委托每次结算后轮换</span><div><button id="exportField">导出存档</button><button id="importField">导入存档</button><input type="file" id="fieldSaveFile" accept=".json,application/json" hidden></div></footer>
 </div>
</section>`);
$('hud').insertAdjacentHTML('beforeend',`<div id="fieldHud"><div class="field-telemetry"><span id="fieldWeather"></span><span id="fieldNext"></span></div><div id="fieldTasks"></div></div><div id="fieldRadio" role="status"><b></b><span></span></div>`);
$('resultDesc').insertAdjacentHTML('afterend','<div id="fieldResults"></div>');
$('routeDesc').insertAdjacentHTML('afterend','<button id="openField" class="field-open"><span>远征准备 / EXPEDITION</span><b id="fieldKitLabel"></b><span>↗</span></button>');
$('help').querySelector('.help-grid').insertAdjacentHTML('afterend','<p class="field-help">2.2 远征：发光箱靠近即可拾取；蓝色求救信号需在 155 单位内、速度低于 12 km/h 停留 1.2 秒。测速门需达到标示速度。重甲需高速冲撞（约 65 km/h）或导弹；背罐感染者死亡后 0.7 秒爆炸，尽快远离。绿色补给 / 蓝色救援 / 橙色测速标记也会显示在行程条上。出发前可在“远征准备”切换战术。</p>');
$('openField').onclick=()=>{normalizeField();fieldTab='prep';renderFieldbook();screen('fieldbook');};
$('closeField').onclick=garage;
$('fieldPrepTab').onclick=()=>{fieldTab='prep';renderFieldbook();};
$('fieldArchiveTab').onclick=()=>{fieldTab='archive';renderFieldbook();};
function renderFieldbook(){
 normalizeField();
 $('fieldPrepTab').classList.toggle('selected',fieldTab==='prep');$('fieldArchiveTab').classList.toggle('selected',fieldTab==='archive');
 if(fieldTab==='prep'){
  $('fieldBody').innerHTML=`<div class="field-section-title"><span>01 / 战术配置</span><small>免费切换 · 不替代已有装备</small></div><div class="kit-grid">${fieldKits.map((k,i)=>`<button data-fieldkit="${k.id}" class="kit-card ${save.fieldKit===k.id?'selected':''}"><span class="kit-code">0${i+1} / ${k.code}</span><strong>${k.name}</strong><span>${k.desc}</span><b>${save.fieldKit===k.id?'✓ 已配置':'选择配置 →'}</b></button>`).join('')}</div>
 <div class="field-section-title"><span>02 / 本次委托</span><small>自动接取 · 奖励计入结算</small></div><div class="contract-grid">${contractsForRun().map(c=>`<article class="contract-card"><small>FIELD CONTRACT / ${c.id.toUpperCase()}</small><h3>${c.name}</h3><p>${c.desc}</p><b>+$ ${c.reward}</b></article>`).join('')}</div>
 <div class="field-section-title"><span>03 / 前线情报</span><small>${routes[save.selected].name} · ${fieldWeather[save.selected].name}</small></div><div class="intel-grid"><article><b>沿途抉择</b><p>补给直接驶过拾取；救援需要减速停留。测速门则奖励高速通过。上下层都能找到资源。</p></article><article><b>识别异变</b><p>红衣疾行者会追向车辆；钢盔重甲可被高速撞穿；橙色背罐死亡后会闪烁并爆炸。</p></article></div>`;
  document.querySelectorAll('[data-fieldkit]').forEach(b=>b.onclick=()=>{save.fieldKit=b.dataset.fieldkit;persist();renderFieldbook();});
 }else{
  const s=save.fieldStats;
  $('fieldBody').innerHTML=`<div class="field-totals"><div><b>${s.rescues}</b><span>生还者获救</span></div><div><b>${s.contracts}</b><span>委托已完成</span></div><div><b>${s.maxAir.toFixed(1)}s</b><span>最长滞空</span></div><div><b>${save.fieldBadges.length}/8</b><span>成就已解锁</span></div></div><div class="field-section-title"><span>生存纪念章</span><small>达成后自动领奖 · 每项仅一次</small></div><div class="badge-grid">${fieldBadges.map((b,i)=>{const done=save.fieldBadges.includes(b.id);const n=Math.min(b.target,b.progress(s));return `<article class="badge-card ${done?'earned':''}"><div class="badge-symbol">${done?'✓':String(i+1).padStart(2,'0')}</div><div><h3>${b.name}</h3><p>${b.desc}</p><div class="badge-track"><i style="width:${n/b.target*100}%"></i></div><small>${done?'已达成 · 奖励已入账':(Number.isInteger(n)?n:n.toFixed(1))+' / '+b.target+' · +$'+b.reward}</small></div></article>`;}).join('')}</div>`;
 }
}
$('exportField').onclick=()=>{
 normalizeField();const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dustrun-save-v2.2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已导出。换文件或浏览器时可从这里导入。');
};
$('importField').onclick=()=>$('fieldSaveFile').click();
$('fieldSaveFile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  if(file.size>1024*1024)throw Error('too large');
  const s=JSON.parse(await file.text());
  if(s.version!==1||!Array.isArray(s.up)||s.up.length!==6||!s.up.every(n=>Number.isFinite(n)&&n>=0&&n<=5)||!Number.isFinite(s.money)||s.money<0||!Number.isInteger(s.unlocked)||s.unlocked<0||s.unlocked>5)throw Error('invalid');
  if(!confirm('导入将覆盖当前本地进度。建议先导出备份。确定继续？'))return;
  const safe=defaults();
  for(const key of ['money','unlocked','selected','kills','runs','wins','vehicle','armor','booster','manualLevel','autoLevel'])if(Number.isFinite(s[key]))safe[key]=Math.max(0,Math.floor(s[key]));
  safe.money=Math.min(safe.money,1e10);safe.up=s.up.map(Math.floor);
  for(const [key,max] of [['ownedVehicles',6],['ownedArmor',3],['ownedBoosters',3]])if(Array.isArray(s[key]))safe[key]=s[key].filter(n=>Number.isInteger(n)&&n>=0&&n<=max);
  safe.best=Array.from({length:6},(_,i)=>Math.max(0,Math.min(1e8,Number(s.best?.[i])||0)));
  for(const key of ['sound','gore','shake','quality','weather','horde'])if(typeof s.settings?.[key]==='boolean')safe.settings[key]=s.settings[key];
  if(typeof s.autoEnabled==='boolean')safe.autoEnabled=s.autoEnabled;
  safe.fieldKit=s.fieldKit;safe.fieldStats=s.fieldStats;safe.fieldBadges=s.fieldBadges;safe.endlessBest=s.endlessBest;
  save=safe;normalizeLoadout();normalizeField();persist();renderFieldbook();toast('存档导入成功。');
 }catch(err){toast('无法导入：请选择有效的尘暴突围 JSON 存档。');}finally{e.target.value='';}
};
const expeditionGarage=renderGarage;
renderGarage=function(){normalizeField();expeditionGarage();$('fieldKitLabel').textContent=fieldKits.find(k=>k.id===save.fieldKit).name+' · 3 项委托';};
const expeditionStart=startRun;
startRun=function(){
 normalizeField();expeditionStart();
 Object.assign(run,{supplies:0,rescues:0,specialKills:0,speedGates:0});
 field={cash:0,kit:save.fieldKit,pickups:[],rescues:[],gates:[],fuses:[],completed:[],contracts:contractsForRun(),radio:null,weather:fieldWeather[run.stage],landing:car.lastLanding,damagePulse:0,lowFuel:false,lowHp:false,settled:false};
 if(field.kit==='scout'){car.maxFuel*=1.15;car.fuel=car.maxFuel;}
 if(field.kit==='stunt'){car.maxBoost*=1.25;car.boost=car.maxBoost;}
 const rng=seeded(22007+run.stage*139),len=routes[run.stage].len;
 for(let x=1100;x<len-400;x+=1150){
  const upper=platforms.find(p=>p.hp>0&&p.kind!=='ramp'&&p.level===0&&x>=p.x1+18&&x<=p.x2-18);
  const elevated=!!upper&&rng()<.45;
  field.pickups.push({x,y:elevated?platformY(upper,x)-24:ground(x)-24,platform:elevated?upper.id:null,type:['fuel','repair','ammo'][Math.floor(rng()*3)],taken:false,phase:rng()*6.28,vy:0});
 }
 for(let x=2450;x<len-800;x+=6700)field.rescues.push({x,y:ground(x),progress:0,done:false,missed:false});
 for(let x=4100;x<len-600;x+=5900)field.gates.push({x,y:ground(x),required:run.stage<2?58:70,done:false,passed:false});
 for(const z of zombies){
  const t=rng();z.variant=t<.09?'armored':t<.17?'volatile':t<.30?'runner':'normal';
  if(z.x<1700&&run.stage===0)z.variant=t<.18?'runner':'normal';
  if(z.variant==='armored'){z.skin='#9eaa92';z.shirt='#677776';z.armorIntact=true;z.scale*=1.08;}
  if(z.variant==='runner'){z.shirt='#905b4d';if(z.platform==null)z.walk=-40-rng()*15;}
  if(z.variant==='volatile'){z.shirt='#9a7544';z.skin='#b2ab76';}
 }
 document.querySelectorAll('.field-route-marker').forEach(n=>n.remove());
 const progress=document.querySelector('.distance .progress');
 for(const [list,kind] of [[field.pickups,'supply'],[field.rescues,'rescue'],[field.gates,'gate']])for(const item of list){const n=document.createElement('i');n.className='field-route-marker '+kind;n.style.left=clamp((item.x-140)/len*100,0,100)+'%';n.title=kind==='supply'?'补给':kind==='rescue'?'救援':'测速门';progress.append(n);}
 fieldMessage('避难所 / 频段 07.4',field.weather.radio);
 $('fieldResults').innerHTML='';updateHUD();
};
$('launchBtn').onclick=startRun;$('retryBtn').onclick=startRun;
const expeditionHit=hitZombie;
hitZombie=function(z){
 if(z.hit)return;
 if(field&&z.variant==='armored'&&z.armorIntact&&!hitContext&&Math.abs(car.vx)<430){
  if((z.staggerUntil||0)>run.elapsed)return;
  z.armorIntact=false;z.staggerUntil=run.elapsed+.7;car.vx*=.88;damageCar(3,'zombie');
  burst(z.x,z.y-45,9,'#c4d1c3',.7,'shard');floater(z.x,z.y-110,'重甲破裂','#d4dfdc');AudioSystem.hit(.5,true);return;
 }
 if((z.staggerUntil||0)>run.elapsed&&!hitContext)return;
 expeditionHit(z);
 if(field&&z.variant&&z.variant!=='normal'){
  run.specialKills++;field.cash+=z.variant==='armored'?9:z.variant==='volatile'?7:4;
  if(z.variant==='volatile'){field.fuses.push({x:z.x,y:z.y-28,at:run.elapsed+.7});floater(z.x,z.y-115,'背罐引燃 · 远离！','#ffbf7c');}
 }
};
const expeditionDamage=damageCar;
damageCar=function(amount,kind='impact'){
 if(field&&run&&!run.finished){if(field.kit==='breach'&&kind==='explosion')amount*=.8;if(field.kit==='stunt'&&kind==='landing')amount*=.65;if(amount>2)field.damagePulse=Math.min(.35,field.damagePulse+.06);}
 expeditionDamage(amount,kind);
};
const expeditionLaunch=launchMissile;
launchMissile=function(auto=false,target=null){const count=rockets.length;const out=expeditionLaunch(auto,target);if(field?.kit==='breach'&&!auto)for(let i=count;i<rockets.length;i++)rockets[i].radius*=1.18;return out;};
const expeditionProp=hitProp;
hitProp=function(p){const countable=field&&p.type==='supply'&&!p.hit;expeditionProp(p);if(countable&&p.hit){run.supplies++;if(field.kit==='scout'){car.hp=Math.min(car.maxHp,car.hp+7);car.fuel=Math.min(car.maxFuel,car.fuel+1.75);car.boost=Math.min(car.maxBoost,car.boost+.35);}}};
function takeFieldSupply(p){
 p.taken=true;run.supplies++;const multiplier=field.kit==='scout'?1.25:1;
 if(p.type==='fuel')car.fuel=Math.min(car.maxFuel,car.fuel+6*multiplier);
 if(p.type==='repair')car.hp=Math.min(car.maxHp,car.hp+24*multiplier);
 if(p.type==='ammo'){car.manualAmmo=Math.min(3+save.manualLevel*2,car.manualAmmo+Math.ceil(2*multiplier));car.boost=Math.min(car.maxBoost,car.boost+1.1*multiplier);}
 burst(p.x,p.y,8,p.type==='ammo'?'#e8c57c':'#a6d9b4',.35,'shard');
 floater(p.x,p.y-55,{fuel:'燃料补充',repair:'装甲修复',ammo:'弹药 / 氮气补充'}[p.type],'#c9e8b8');AudioSystem.tone(460,920,.16,.07);
}
function updateField(dt){
 if(!field||run.finished)return;
 field.damagePulse=Math.max(0,field.damagePulse-dt*.6);
 for(const p of field.pickups){
  if(p.taken)continue;
  if(p.platform!=null&&platforms[p.platform]?.hp<=0){p.platform=null;p.vy=20;}
  if(p.platform==null&&p.y<ground(p.x)-24){p.vy+=500*dt;p.y=Math.min(ground(p.x)-24,p.y+p.vy*dt);}
  if(Math.abs(car.x-p.x)<105&&Math.abs(car.y-p.y)<94)takeFieldSupply(p);
 }
 for(const s of field.rescues){
  if(s.done)continue;
  const near=Math.abs(car.x-s.x)<155&&Math.abs(car.y-(s.y-55))<110;
  if(near&&Math.abs(car.vx)<80){s.progress+=dt;if(s.progress>=1.2){s.done=true;run.rescues++;fieldReward(180,'生还者已接应',s.x,s.y-130);car.fuel=Math.min(car.maxFuel,car.fuel+3);fieldMessage('生还者 / 已转移','谢谢你停下。补给留给你，下一段路还有人需要帮助。','#b5e3dc');}}
  else s.progress=Math.max(0,s.progress-dt*.5);
  if(!s.missed&&car.x>s.x+270){s.missed=true;fieldMessage('避难所 / 路边信号','你已驶过求救点。可以刹车倒回；蓝色标记仍会等你。');}
 }
 for(const g of field.gates){
  if(g.passed||car.x<g.x)continue;
  g.passed=true;
  if(car.vx*.15>=g.required){g.done=true;run.speedGates++;fieldReward(140,'测速通过');}
  else{floater(car.x,car.y-120,'测速未达标 · '+g.required+' km/h','#d0c3a1');}
 }
 for(const z of zombies){if(z.hit||z.variant!=='runner'||z.platform!=null||Math.abs(z.x-car.x)>850)continue;z.walk=car.x<z.x?-52:42;}
 const due=field.fuses.filter(f=>run.elapsed>=f.at);field.fuses=field.fuses.filter(f=>run.elapsed<f.at);
 for(const f of due)explode(f.x,f.y,135,.8,'environment');
 for(const c of field.contracts)if(!field.completed.includes(c.id)&&c.value(run)>=c.target){field.completed.push(c.id);fieldReward(c.reward,'委托完成 · '+c.name);fieldMessage('委托回执 / 已登记',c.name+'已完成。奖励 $'+c.reward+' 将计入本次结算。','#e9cb89');}
 if(!field.lowFuel&&car.fuel/car.maxFuel<.2){field.lowFuel=true;fieldMessage('车载诊断 / 燃料警报','油量不足 20%。留意绿色油滴补给，松开氮气可节省燃料。','#e7bc7b');}
 if(!field.lowHp&&car.hp/car.maxHp<.25){field.lowHp=true;fieldMessage('车载诊断 / 装甲警报','装甲低于 25%。寻找十字修理箱，避开橙色爆破物。','#efac90');}
 if(car.lastLanding!==field.landing){if(run.air>1)AudioSystem.tone(120,50,.1,.025);field.landing=car.lastLanding;}
}
const expeditionPhysics=physics;
physics=function(dt){if(state==='run'&&field)updateField(dt);expeditionPhysics(dt);};
const expeditionFinish=finish;
finish=function(reason,win=false){
 if(!run||run.finished)return;
 let notes=[],bonus=0,badgeNames=[];
 if(field&&!field.settled){
  // Evaluate final-frame goals (e.g. the last kill or finish distance) before payout.
  for(const c of field.contracts)if(!field.completed.includes(c.id)&&c.value(run)>=c.target){field.completed.push(c.id);field.cash+=c.reward;}
  field.settled=true;normalizeField();const s=save.fieldStats;
  for(const key of ['rescues','supplies','specialKills','speedGates'])s[key]+=run[key]||0;
  s.structures+=run.collapses||0;s.contracts+=field.completed.length;s.maxAir=Math.max(s.maxAir,run.maxAir||0);
  for(const b of fieldBadges)if(!save.fieldBadges.includes(b.id)&&b.progress(s)>=b.target){save.fieldBadges.push(b.id);bonus+=b.reward;badgeNames.push(b.name);}
  bonus+=field.cash;s.cash+=bonus;save.money+=bonus;
  notes=[`补给 ${run.supplies} · 救援 ${run.rescues} · 特殊清除 ${run.specialKills}`,`委托 ${field.completed.length}/3 · 测速 ${run.speedGates} · 远征额外 +$${fmt(bonus)}`];
 }
 expeditionFinish(reason,win);
 const base=Number($('resMoney').textContent.replace(/[^0-9]/g,''));$('resMoney').textContent='+ $ '+fmt(base+bonus);
 $('fieldResults').innerHTML=notes.map(n=>`<span>${n}</span>`).join('')+(badgeNames.length?`<b>新成就：${badgeNames.join(' / ')}</b>`:'');
};
const expeditionHud=updateHUD;
updateHUD=function(){
 expeditionHud();if(!field||!run||run.vehicle==null)return;
 $('fieldWeather').textContent=field.weather.name+' / '+fieldKits.find(k=>k.id===field.kit).name;
 const next=[...field.pickups.filter(p=>!p.taken).map(p=>({...p,label:'补给'})),...field.rescues.filter(p=>!p.done).map(p=>({...p,label:'救援'})),...field.gates.filter(p=>!p.passed).map(p=>({...p,label:'测速'}))].filter(p=>p.x>car.x-100).sort((a,b)=>a.x-b.x)[0];
 $('fieldNext').textContent=next?next.label+' '+Math.max(0,Math.round((next.x-car.x)/12))+'m':'前往避难所';
 $('fieldTasks').innerHTML=field.contracts.map(c=>`<span class="${field.completed.includes(c.id)?'done':''}">${field.completed.includes(c.id)?'✓':'◇'} ${c.name} <b>${Math.min(c.target,c.value(run))}/${c.target}</b></span>`).join('');
 const radio=field.radio,visible=radio&&run.elapsed<radio.until;
 $('fieldRadio').classList.toggle('visible',!!visible);
 if(visible){$('fieldRadio').querySelector('b').textContent=radio.title;$('fieldRadio').querySelector('b').style.color=radio.color;$('fieldRadio').querySelector('span').textContent=radio.text;}
};
const expeditionZombie=drawZombie;
drawZombie=function(z){
 expeditionZombie(z);if(!z.variant||z.variant==='normal')return;
 ctx.save();ctx.translate(z.x,z.y);ctx.scale(z.scale,z.scale);
 if(z.variant==='armored'){
  if(z.armorIntact){rect(-10,-39,20,20,'#75827c');line(-8,-33,8,-33,'#b1b9a5',2);line(0,-39,0,-19,'#35483e',2);poly([[-10,-50],[-7,-58],[5,-59],[10,-52],[9,-47],[-10,-47]],'#7c8b83','#343f39',1);}
  else line(-7,-35,6,-23,'#d6d4ad',2);
 }
 if(z.variant==='volatile'){rect(8,-37,10,24,'#ba713d');rect(10,-41,6,5,'#655d43');line(10,-31,16,-25,'#f1cc75',2);circle(13,-19,2.5,'#e7aa59');}
 if(z.variant==='runner'){line(-6,-35,6,-26,'#d9a085',2);line(-12,-11,-6,-7,'#ca8a68',2);}
 ctx.restore();
};
function drawFieldWorld(left,right){
 if(!field)return;
 const now=run.elapsed;
 for(const p of field.pickups){
  if(p.taken||p.x<left||p.x>right)continue;
  const col=p.type==='ammo'?'#edc578':p.type==='repair'?'#b6e1b7':'#92ccb2';const bob=reducedFieldMotion?0:Math.sin(now*3+p.phase)*3;
  ctx.save();ctx.translate(p.x,p.y+bob);ctx.globalAlpha=.12;circle(0,0,36,col);ctx.globalAlpha=1;
  rect(-17,-18,34,34,'#243e31');ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-17,-18,34,34);rect(-19,11,38,5,'#1b3028');
  if(p.type==='repair'){rect(-3,-11,6,22,col);rect(-11,-3,22,6,col);}
  if(p.type==='fuel'){poly([[0,-12],[-7,0],[-6,6],[0,10],[6,6],[7,0]],col);}
  if(p.type==='ammo'){for(let i=-1;i<=1;i++){rect(i*8-2,-5,4,14,col);poly([[i*8-2,-6],[i*8,-11],[i*8+2,-6]],col);}}
  line(-19,24,19,24,col,1);ctx.restore();
 }
 for(const s of field.rescues){
  if(s.x<left-150||s.x>right+150)continue;
  ctx.save();ctx.translate(s.x,s.y);
  line(-45,0,-45,-125,'#738b7d',3);rect(-45,-125,64,22,s.done?'#42624d':'#286563');ctx.fillStyle='#d4eece';ctx.font='bold 12px system-ui';ctx.textAlign='left';ctx.fillText(s.done?'已接应':'SOS',-36,-109);
  if(!s.done){
   ctx.globalAlpha=.15+(reducedFieldMotion?0:Math.sin(now*4)*.05);poly([[-45,-122],[-85,-210],[-6,-210]],'#a8eadb');ctx.globalAlpha=1;
   line(0,-23,-9,-2,'#536a57',5);line(1,-23,12,-3,'#536a57',5);rect(-7,-48,17,27,'#879c74');circle(1,-57,7,'#d0bb8b');
   const wave=reducedFieldMotion?0:Math.sin(now*6)*8;line(7,-42,22,-65-wave,'#bfb78b',4);line(-5,-40,-18,-22,'#9eae83',4);
  }else{line(-8,-12,0,-5,'#b0deb9',3);line(0,-5,16,-27,'#b0deb9',3);}
  ctx.restore();
 }
 for(const g of field.gates){
  if(g.x<left-50||g.x>right+50)continue;
  const col=g.done?'#b2daa9':g.passed?'#857c69':'#edc377';ctx.save();ctx.translate(g.x,g.y);
  line(0,0,0,-185,'#77816a',4);rect(-32,-191,64,42,'#26392c');ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(-32,-191,64,42);
  ctx.fillStyle=col;ctx.textAlign='center';ctx.font='bold 22px system-ui';ctx.fillText(g.done?'✓':g.required,0,-163);ctx.font='10px system-ui';ctx.fillText('KM/H',0,-133);
  if(!g.passed){ctx.setLineDash([8,12]);line(0,-123,0,-8,'#dfbc7b66',2);ctx.setLineDash([]);}ctx.restore();
 }
 for(const f of field.fuses){if(f.x<left||f.x>right)continue;const t=clamp((f.at-now)/.7,0,1);ctx.globalAlpha=.5;circle(f.x,f.y,28+(1-t)*55,null,'#ffc077',2);ctx.globalAlpha=1;circle(f.x,f.y,5+(1-t)*6,'#ffe8af');}
}
// Objects render after bridge structure; interaction prompts render above all world sprites.
const expeditionArsenal=drawArsenalWorld;
drawArsenalWorld=function(...args){
 expeditionArsenal(...args);if(!field)return;
 for(const s of field.rescues){if(s.done||Math.abs(car.x-s.x)>=220)continue;
  ctx.save();ctx.translate(s.x,s.y-156);rect(-95,-21,190,49,'#142c24ec');
  ctx.fillStyle='#d9ede0';ctx.font='bold 13px system-ui';ctx.textAlign='center';
  const upper=Math.abs(car.y-(s.y-55))>110;
  ctx.fillText(upper?'地面救援 · 请走下层':'减速停靠 · 接应 '+Math.min(100,Math.floor(s.progress/1.2*100))+'%',0,-2);
  rect(-77,11,154,4,'#576b54');rect(-77,11,154*clamp(s.progress/1.2,0,1),4,'#9bdcca');ctx.restore();
 }
};
function drawFieldWeather(){
 if(!field||!save.settings.weather)return;
 const w=field.weather,now=run.elapsed,quality=save.settings.quality&&!reducedFieldMotion;
 ctx.save();
 if(w.kind==='fog'){
  const gr=ctx.createLinearGradient(0,H*.3,0,H);gr.addColorStop(0,'#aecfc000');gr.addColorStop(.8,'#c8dfce16');gr.addColorStop(1,'#c8dfce32');rect(0,0,W,H,gr);
 }
 const count=reducedFieldMotion?0:quality?Math.round(W/19):Math.round(W/55);
 for(let i=0;i<count;i++){
  const seed=hash(i*7+run.stage*503),speed=w.kind==='rain'?490:30+seed*90;
  const x=((i*197.31-now*(w.kind==='rain'?110:35+seed*40)-camera.x*.06)%(W+100)+W+100)%(W+100)-50;
  const y=((seed*H*3+now*speed)%(H+80))-40;
  ctx.globalAlpha=w.kind==='rain'?.19:.10+seed*.25;
  if(w.kind==='rain')line(x,y,x-9,y+25,w.color,1);
  else if(w.kind==='ember'){circle(x,y,seed> .6?1.7:1,w.color);}
  else line(x,y,x+6+seed*12,y-2,w.color,seed>.8?2:1);
 }
 ctx.restore();
}
const expeditionRender=renderRun;
renderRun=function(dt){expeditionRender(dt);if(!field)return;drawFieldWeather();if(field.damagePulse>0&&!reducedFieldMotion){ctx.save();ctx.globalAlpha=field.damagePulse*.45;ctx.strokeStyle='#f3c997';ctx.lineWidth=5;ctx.strokeRect(2,2,W-4,H-4);ctx.restore();}};
const expeditionSettings=renderSettings;
$('qualityToggle').closest('.settings-row').insertAdjacentHTML('afterend','<div class="settings-row"><span>区域天气与环境粒子</span><button class="toggle" id="weatherToggle"></button></div>');
renderSettings=function(){expeditionSettings();normalizeField();$('weatherToggle').textContent=save.settings.weather?'开启':'关闭';$('weatherToggle').classList.toggle('on',save.settings.weather);};
$('weatherToggle').onclick=()=>{save.settings.weather=!save.settings.weather;persist();renderSettings();};
const expeditionSnapshot=window.DustRun.snapshot;
window.DustRun={version:'2.2.0',snapshot:()=>({...expeditionSnapshot(),expedition:field?{kit:field.kit,weather:field.weather.name,cash:field.cash,contracts:field.contracts.map(c=>({id:c.id,value:c.value(run),target:c.target,completed:field.completed.includes(c.id)})),pickups:field.pickups.map(p=>({...p})),rescues:field.rescues.map(s=>({...s})),gates:field.gates.map(g=>({...g})),fuses:field.fuses.length}:null,specialTypes:zombies.filter(z=>!z.hit).reduce((a,z)=>(a[z.variant||'normal']=(a[z.variant||'normal']||0)+1,a),{})})};
// Escape returns from the dossier without affecting pause or driving controls.
addEventListener('keydown',e=>{if(e.code==='Escape'&&state==='fieldbook'){e.preventDefault();garage();}});
// Vehicle wear is visual-only; no hidden physics modifiers.
const fieldVehicleDetail=drawVehicleKit;
drawVehicleKit=function(v,rot,travel){
 fieldVehicleDetail(v,rot,travel);
 if(!field||!car||!['run','pause','result'].includes(state))return;
 const wear=1-clamp(car.hp/car.maxHp,0,1);
 if(control.brake){rect(-80,3,6,9,'#f2a38b');ctx.globalAlpha=.15;circle(-78,8,17,'#ef7256');ctx.globalAlpha=1;}
 if(wear>.3){
  line(27,-20,42,-10,'#a5a487',1.5);line(35,-19,30,-9,'#c0b08a',1);
  line(-17,-7,-9,0,'#b1ab87',1);line(54,8,64,3,'#b1ab87',1);
 }
 if(wear>.65&&!reducedFieldMotion){
  ctx.save();ctx.globalAlpha=.18;
  for(let i=0;i<4;i++){const t=(run.elapsed*.65+i*.26)%1;circle(49-t*16,-20-t*70,6+t*16,'#334338');}
  ctx.restore();
 }
};
// Quiet synthesized weather bed. It obeys sound, weather and pause switches.
const fieldAudioUpdate=AudioSystem.update.bind(AudioSystem);
const fieldAudioDriving=AudioSystem.setDriving.bind(AudioSystem);
AudioSystem.setDriving=function(on){fieldAudioDriving(on);if(!on&&this.fieldGain&&this.ac)this.fieldGain.gain.setTargetAtTime(0,this.ac.currentTime,.08);};
AudioSystem.update=function(){
 fieldAudioUpdate();if(!this.ac||!this.master||!this.noise)return;
 if(!this.fieldGain&&field){
  this.fieldNoise=this.ac.createBufferSource();this.fieldNoise.buffer=this.noise;this.fieldNoise.loop=true;
  this.fieldFilter=this.ac.createBiquadFilter();this.fieldGain=this.ac.createGain();this.fieldGain.gain.value=0;
  this.fieldNoise.connect(this.fieldFilter);this.fieldFilter.connect(this.fieldGain);this.fieldGain.connect(this.master);this.fieldNoise.start();
 }
 if(this.fieldGain){
  const wet=field?.weather.kind==='rain';this.fieldFilter.type=wet?'highpass':'lowpass';
  this.fieldFilter.frequency.setTargetAtTime(wet?1100:420,this.ac.currentTime,.2);
  this.fieldGain.gain.setTargetAtTime(this.driving&&save.settings.sound&&save.settings.weather?(.018+clamp(Math.abs(car?.vx||0)/500,0,1)*.015):0,this.ac.currentTime,.15);
 }
};
