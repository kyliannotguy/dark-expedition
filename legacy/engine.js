(function(root){
'use strict';
const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.GAME_DATA;
const {RULES:R,cards:C,classes:CL,enemies:E,events:EV}=D;
function random(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function log(s,text){s.history.push(text);if(s.history.length>160)s.history.shift();if(s.battle){s.battle.log.push(text);if(s.battle.log.length>80)s.battle.log.shift();}}
function newRun(classId,seed=Date.now()){
 if(!CL[classId])throw new Error('未知职业');const c=CL[classId];
 let s={version:R.version,classId,rng:(seed>>>0)||123456789,phase:'adventure',hp:c.hp,maxHp:c.hp,baseEnergy:R.initialEnergy,credits:R.initialCredits,level:1,xp:0,nextLevel:R.levelXpStart,deck:[...c.deck],backpack:['medkit'],queue:[],field:[],selected:null,resolved:0,total:13,history:[],battle:null,reward:null,battlesWon:0,turns:0,startedAt:Date.now(),bossSpawned:false};
 s.queue=D.adventure.map((key,i)=>({uid:'enc-'+i,key,kind:E[key]?'enemy':'event'}));
 // Keep the first three introductory encounters legible; later blocks vary by seed.
 s.queue=[...s.queue.slice(0,3),...shuffle(s,s.queue.slice(3,6)),...shuffle(s,s.queue.slice(6,9)),...shuffle(s,s.queue.slice(9))];
 fill(s);log(s,'远征开始。任务：回收灰烬巢都传讯核心，终止裂隙仪式。');return s;
}
function fill(s){while(s.field.length<3&&s.queue.length)s.field.push(s.queue.shift());if(!s.field.length&&!s.queue.length&&!s.bossSpawned){s.bossSpawned=true;s.field.push({uid:'final',key:'boss',kind:'enemy'});log(s,'传讯核心已定位。裂隙守望者阻断了最后的通路。');}}
function encounter(s){return s.field.find(e=>e.uid===s.selected);}
function select(s,uid){if(s.phase!=='adventure'||!s.field.some(e=>e.uid===uid))return false;s.selected=uid;return true;}
function completeEncounter(s){s.field=s.field.filter(e=>e.uid!==s.selected);s.selected=null;s.resolved++;s.battle=null;s.reward=null;s.phase='adventure';fill(s);}
function unit(s,name,hp,maxHp,energy,deck){return {name,hp,maxHp,energy,baseEnergy:energy,draw:shuffle(s,deck),hand:[],discard:[],equipment:[],prepared:null,block:0,burn:0,suppress:0,turns:0};}
function draw(s,u,n){let drawn=0;for(let i=0;i<n;i++){if(u.hand.length>=R.handLimit){log(s,u.name+'：手牌已满，停止抽牌。');break;}if(!u.draw.length){if(!u.discard.length)break;u.draw=shuffle(s,u.discard);u.discard=[];log(s,u.name+'：坟场洗回牌堆。');}u.hand.push(u.draw.shift());drawn++;}return drawn;}
function beginBattle(s){let en=encounter(s);if(s.phase!=='adventure'||!en||en.kind!=='enemy')return false;let e=E[en.key];s.phase='combat';s.battle={enemyKey:en.key,round:1,active:'player',log:[],last:null,player:unit(s,CL[s.classId].name,s.hp,s.maxHp,s.baseEnergy,s.deck),enemy:unit(s,e.name,e.hp,e.hp,e.energy,e.deck)};draw(s,s.battle.player,R.initialHand);draw(s,s.battle.enemy,R.initialHand);s.battle.player.turns=1;log(s,'交战：'+e.name+'。双方起手 3 张。');return true;}
function passive(u,id){return u.equipment.filter(x=>C[x].passive===id).length;}
function heal(s,u,n){let amount=Math.min(n,u.maxHp-u.hp);u.hp+=amount;if(amount)log(s,u.name+' 恢复 '+amount+' 点生命。');}
function rawDamage(s,u,n,attr,why){let reduced=attr==='物理'?Math.min(n,passive(u,'armor')):0;n-=reduced;let shield=Math.min(u.block,n);u.block-=shield;n-=shield;u.hp=Math.max(0,u.hp-n);log(s,u.name+' 受到 '+n+' 点'+attr+'伤害'+(reduced||shield?'（减伤 '+(reduced+shield)+'）':'')+' · '+why);return n;}
function directDamage(s,source,target,n,attr){
 n+=attr==='物理'?passive(source,'aim'):0;
 let reaction=target.prepared;
 if(reaction){target.prepared=null;}else{let idx=target.hand.findIndex(id=>C[id].type==='reaction'&&C[id].cost<=target.energy);if(idx>=0){reaction=target.hand.splice(idx,1)[0];target.energy-=C[reaction].cost;}}
 if(reaction){target.discard.push(reaction);let reflect=Math.min(n,C[reaction].reflect);n-=reflect;log(s,target.name+' 触发「'+C[reaction].name+'」：反射 '+reflect+' 点。');rawDamage(s,source,reflect,attr,'反射，不再触发应对');}
 rawDamage(s,target,n,attr,'直接命中');
}
function canPlay(s,side,index){if(s.phase!=='combat'||!s.battle||s.battle.active!==side)return '尚未轮到该单位';let u=s.battle[side],id=u.hand[index],c=C[id];if(!c)return '卡牌不存在';if(u.energy<c.cost)return '能源不足';if(c.type==='equipment'&&u.equipment.length>=R.equipmentSlots)return '装备位已满，请先卸下装备';if(c.type==='reaction'&&u.prepared)return '已有待命应对';return null;}
function playCard(s,side,index){let reason=canPlay(s,side,index);if(reason)return {ok:false,reason};let b=s.battle,u=b[side],v=b[side==='player'?'enemy':'player'],id=u.hand.splice(index,1)[0],c=C[id];u.energy-=c.cost;b.last={card:id,side};log(s,u.name+' 使用「'+c.name+'」'+(c.cost?'，消耗 '+c.cost+' 能源':'（零费）')+'。');
 if(c.type==='equipment')u.equipment.push(id);else if(c.type==='reaction')u.prepared=id;
 if(c.energy){u.energy+=c.energy;log(s,u.name+' 获得 '+c.energy+' 能源。');}if(c.draw)draw(s,u,c.draw);if(c.heal)heal(s,u,c.heal);if(c.block){u.block+=c.block;log(s,u.name+' 获得 '+c.block+' 护盾。');}
 if(c.damage)directDamage(s,u,v,c.damage,c.attr);
 if(c.burn&&v.hp>0){v.burn+=c.burn;log(s,v.name+' 获得 '+c.burn+' 层焚烧。');}if(c.suppress&&v.hp>0){v.suppress=Math.max(v.suppress,c.suppress);log(s,v.name+' 被压制 '+c.suppress+' 回合。');}
 if(c.selfDamage){u.hp=Math.max(0,u.hp-c.selfDamage);log(s,u.name+' 过载反噬，失去 '+c.selfDamage+' 点生命。');}
 if(c.type!=='equipment'&&c.type!=='reaction')u.discard.push(id);s.hp=b.player.hp;checkOutcome(s);return {ok:true};
}
function addExperience(s,xp){s.xp+=xp;while(s.xp>=s.nextLevel){s.xp-=s.nextLevel;s.level++;s.nextLevel+=R.levelXpStep;s.maxHp+=R.levelHp;s.hp=Math.min(s.maxHp,s.hp+R.levelHp);s.baseEnergy=R.initialEnergy+Math.floor(s.level/R.energyPerLevels);log(s,'晋升 Lv.'+s.level+'：生命上限 +3、恢复 3；基础能源 '+s.baseEnergy+'。');}}
function checkOutcome(s){if(s.phase!=='combat')return;let b=s.battle;s.hp=b.player.hp;if(b.player.hp<=0){s.phase='defeat';log(s,'生命信号中断。远征失败。');return;}if(b.enemy.hp>0)return;let e=E[b.enemyKey];s.credits+=e.credits;addExperience(s,e.xp);b.player.hp=s.hp;b.player.maxHp=s.maxHp;b.player.baseEnergy=s.baseEnergy;s.battlesWon++;s.reward={credits:e.credits,xp:e.xp};s.phase=b.enemyKey==='boss'?'victory':'reward';if(s.phase==='victory'){s.resolved=s.total;log(s,'裂隙仪式已终止。传讯核心回收完成。');}else log(s,'交战结束：获得 '+e.xp+' 战功、'+e.credits+' 军需。');}
function startTurn(s,side){if(s.phase!=='combat')return;let b=s.battle,u=b[side];b.active=side;u.block=0;u.energy=u.baseEnergy+passive(u,'servo');u.turns++;
 if(u.burn){let tick=u.burn;u.burn--;u.hp=Math.max(0,u.hp-tick);log(s,u.name+' 焚烧损失 '+tick+' 点生命（无视护盾），剩余 '+u.burn+' 层。');checkOutcome(s);if(s.phase!=='combat')return;}
 let count=u.turns===1?R.firstTurnDraw:R.drawPerTurn;if(u.suppress){count=Math.max(0,count-1);u.suppress--;log(s,u.name+' 受压制，本回合少抽 1 张。');}if(count)draw(s,u,count);log(s,u.name+' 回合开始：能源 '+u.energy+'/'+u.baseEnergy+'。');}
function endEffects(s,u){let faith=passive(u,'faith');if(faith)heal(s,u,faith);}
function enemyTurn(s){if(s.phase!=='combat')return;let u=s.battle.enemy;
 for(let attempts=0;attempts<40&&s.phase==='combat';attempts++){
 let options=u.hand.map((id,i)=>({id,i,c:C[id]})).filter(x=>!canPlay(s,'enemy',x.i)&&x.c.type!=='reaction');
 options=options.filter(x=>!(x.c.heal&&u.hp===u.maxHp&&!x.c.block)&&!(x.c.energy&&!x.c.draw&&!u.hand.some(id=>C[id].cost>u.energy)));
 options.sort((a,b)=>score(b.c,u)-score(a.c,u));if(!options.length)break;playCard(s,'enemy',options[0].i);
 }
}
function score(c,u){return c.energy?100:c.heal&&u.hp<u.maxHp/2?90:c.type==='equipment'?75:c.damage?50+c.damage:c.heal?20:10;}
function endTurn(s){if(s.phase!=='combat'||s.battle.active!=='player')return false;endEffects(s,s.battle.player);startTurn(s,'enemy');enemyTurn(s);if(s.phase==='combat'){endEffects(s,s.battle.enemy);s.battle.round++;s.turns++;startTurn(s,'player');}if(s.battle)s.hp=s.battle.player.hp;return true;}
function discard(s,index){if(s.phase!=='combat'||s.battle.active!=='player')return false;let u=s.battle.player;if(!u.hand[index])return false;let id=u.hand.splice(index,1)[0];u.discard.push(id);log(s,'手动弃置「'+C[id].name+'」。');return true;}
function unequip(s,index){if(s.phase!=='combat'||s.battle.active!=='player')return false;let u=s.battle.player;if(!u.equipment[index])return false;let id=u.equipment.splice(index,1)[0];u.discard.push(id);log(s,'卸下「'+C[id].name+'」，移入坟场。');return true;}
function useItem(s){if(!['adventure','combat'].includes(s.phase)||!s.backpack.length)return {ok:false,reason:'没有可用补给'};let hp=s.phase==='combat'?s.battle.player.hp:s.hp;if(hp>=s.maxHp)return {ok:false,reason:'生命已满，补给已保留'};s.backpack.shift();if(s.phase==='combat'){heal(s,s.battle.player,6);s.hp=s.battle.player.hp;}else{s.hp=Math.min(s.maxHp,s.hp+6);log(s,'使用医疗包，恢复 6 点生命。');}return {ok:true};}
function eventAction(s,action,value){let en=encounter(s);if(s.phase!=='adventure'||!en||en.kind!=='event')return {ok:false,reason:'请先选择事件'};let key=en.key;
 if(action==='leave'){log(s,'离开「'+EV[key].name+'」。');completeEncounter(s);return {ok:true};}
 if(key==='medbay'){
  if(action==='heal'){s.hp=Math.min(s.maxHp,s.hp+R.healAmount);log(s,'接受战地救护，恢复最多 8 点生命。');}
  else if(action==='kit'){if(s.backpack.length>=R.backpackSlots)return {ok:false,reason:'背包已满，请先使用补给'};s.backpack.push('medkit');log(s,'获得医疗包。');}else return {ok:false};
 }else if(key==='armory'){
  let allowed=[...CL[s.classId].rewards];if(action!=='take'||!allowed.includes(value))return {ok:false};s.deck.push(value);log(s,'军械库：获得「'+C[value].name+'」。');
 }else if(key==='purge'){
  if(action!=='remove'||!Number.isInteger(value)||!s.deck[value])return {ok:false};if(s.credits<R.removeCost)return {ok:false,reason:'军需不足'};if(s.deck.length<=5)return {ok:false,reason:'作战牌组至少保留 5 张牌'};s.credits-=R.removeCost;let id=s.deck.splice(value,1)[0];log(s,'战术重整：花费 5 军需，移除「'+C[id].name+'」。');
 }else if(key==='fork'){
  if(action!=='reroute')return {ok:false};let rest=s.field.filter(x=>x.uid!==en.uid);s.queue=shuffle(s,[...rest,...s.queue]);s.field=[en];log(s,'改走维修通道：其余遭遇已放回并重新洗牌。');
 }else if(key==='shrine'){
  if(action!=='relic')return {ok:false};if(s.hp<=3)return {ok:false,reason:'伤势过重，无法承受电击'};s.hp-=3;s.credits+=5;s.deck.push('icon');log(s,'回收圣匣：失去 3 生命，获得圣像与 5 军需。');
 }else if(key==='merchant'){
  let prices={med:6,regroup:7,deflect:7,sight:9};if(action!=='buy'||!prices[value])return {ok:false};if(s.credits<prices[value])return {ok:false,reason:'军需不足'};s.credits-=prices[value];s.deck.push(value);log(s,'军需站：购买「'+C[value].name+'」，支付 '+prices[value]+' 军需。');
 }else return {ok:false};completeEncounter(s);return {ok:true};
}
function claimReward(s){if(s.phase!=='reward')return false;completeEncounter(s);return true;}
function restore(raw){try{let s=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);const validCards=a=>Array.isArray(a)&&a.length<=500&&a.every(id=>!!C[id]);const validEnc=a=>Array.isArray(a)&&a.length<=30&&a.every(e=>e&&typeof e.uid==='string'&&((e.kind==='enemy'&&E[e.key])||(e.kind==='event'&&EV[e.key])));if(!s||s.version!==R.version||!CL[s.classId]||!['adventure','combat','reward','defeat','victory'].includes(s.phase)||!validCards(s.deck)||!Array.isArray(s.history)||!Array.isArray(s.backpack)||!s.backpack.every(x=>x==='medkit')||!validEnc(s.queue)||!validEnc(s.field))return null;for(let n of ['hp','maxHp','credits','level','xp','nextLevel','baseEnergy','rng','resolved','total'])if(!Number.isFinite(s[n])||s[n]<0)return null;if(s.maxHp<1||s.hp>s.maxHp||s.nextLevel<1)return null;if(s.phase==='combat'||s.phase==='reward'){let b=s.battle;if(!b||!E[b.enemyKey]||!Array.isArray(b.log)||!['player','enemy'].includes(b.active))return null;for(let side of ['player','enemy']){let u=b[side];if(!u||!validCards(u.hand)||!validCards(u.draw)||!validCards(u.discard)||!validCards(u.equipment)||u.hand.length>R.handLimit||u.equipment.length>R.equipmentSlots)return null;for(let n of ['hp','maxHp','energy','baseEnergy','block','burn','suppress','turns'])if(!Number.isFinite(u[n])||u[n]<0)return null;if(u.prepared&&!C[u.prepared])return null;}if(s.phase==='combat'&&b.active!=='player')return null;}return s;}catch{return null;}}
const api={newRun,select,encounter,beginBattle,canPlay,playCard,endTurn,discard,unequip,useItem,eventAction,claimReward,restore,draw,checkOutcome};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GAME=api;
})(typeof globalThis!=='undefined'?globalThis:this);
