(function(root){
'use strict';
const D=typeof module!=='undefined'&&module.exports?require('./data.js'):root.GAME_DATA;
const {RULES:R,cards:C,classes:CL,enemies:E,events:EV}=D;
function random(s){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
function shuffle(s,a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
let observer=null;
function log(s,text){s.history.push(text);if(s.history.length>160)s.history.shift();if(s.battle){s.battle.log.push(text);if(s.battle.log.length>80)s.battle.log.shift();}if(observer)observer(s,text);}
function regions(s){return D.campaigns[s.campaign||'crusade'].chapters;}
function newRun(classId,seed=Date.now(),difficulty='veteran',campaign='crusade'){
 if(!CL[classId])throw new Error('未知职业');const c=CL[classId];
 let s={version:R.version,classId,campaign:D.campaigns[campaign]?campaign:'crusade',rng:(seed>>>0)||123456789,phase:'adventure',hp:c.hp,maxHp:c.hp,baseEnergy:R.initialEnergy,credits:R.initialCredits,level:1,xp:0,nextLevel:R.levelXpStart,deck:[...c.deck],backpack:['medkit'],queue:[],field:[],selected:null,resolved:0,total:33,chapter:0,difficulty:D.difficulties[difficulty]?difficulty:'veteran',talents:[],history:[],battle:null,reward:null,battlesWon:0,turns:0,startedAt:Date.now(),bossSpawned:false};
 loadChapter(s);log(s,'远征开始：'+D.difficulties[s.difficulty].name+'难度。'+D.campaigns[s.campaign].brief);return s;
}
function loadChapter(s){let c=regions(s)[s.chapter];s.bossSpawned=false;s.field=[];let list=c.cards.map((key,i)=>({uid:'c'+s.chapter+'-'+i,key,kind:E[key]?'enemy':'event'}));s.queue=[...list.slice(0,3),...shuffle(s,list.slice(3))];fill(s);}
function fill(s){while(s.field.length<3&&s.queue.length)s.field.push(s.queue.shift());if(!s.field.length&&!s.queue.length&&!s.bossSpawned){s.bossSpawned=true;let chapter=regions(s)[s.chapter],pool=chapter.bosses||[chapter.boss],key=pool[Math.floor(random(s)*pool.length)];s.field.push({uid:'boss-'+s.chapter,key,kind:'enemy',boss:true});log(s,'区域首领已锁定：'+E[key].name+'。');}}
function encounter(s){return s.field.find(e=>e.uid===s.selected);}
function select(s,uid){if(s.phase!=='adventure'||!s.field.some(e=>e.uid===uid))return false;s.selected=uid;return true;}
function completeEncounter(s){delete s.beforeBattle;if(s.reward?.chapterClear){s.resolved++;s.chapter++;s.selected=null;s.battle=null;s.reward=null;s.phase='adventure';s.hp=Math.min(s.maxHp,s.hp+8);loadChapter(s);log(s,'进入'+regions(s)[s.chapter].name+'，运输途中恢复 8 生命。');return;}s.field=s.field.filter(e=>e.uid!==s.selected);s.selected=null;s.resolved++;s.battle=null;s.reward=null;s.phase='adventure';fill(s);}
function unit(s,name,hp,maxHp,energy,deck){return {name,hp,maxHp,energy,baseEnergy:energy,draw:shuffle(s,deck),hand:[],discard:[],equipment:[],prepared:null,block:0,burn:0,poison:0,suppress:0,turns:0,mark:0,vulnerable:0,weaken:0,devotion:0,heat:0,skillCd:0,firstAttack:true,firstEquip:true,bonus:0};}
function draw(s,u,n){let drawn=0;for(let i=0;i<n;i++){if(u.hand.length>=R.handLimit){log(s,u.name+'：手牌已满，停止抽牌。');break;}if(!u.draw.length){if(!u.discard.length)break;u.draw=shuffle(s,u.discard);u.discard=[];log(s,u.name+'：坟场洗回牌堆。');}u.hand.push(u.draw.shift());drawn++;}if(drawn)log(s,u.name+' 抽取 '+drawn+' 张牌。');return drawn;}
function beginBattle(s){let en=encounter(s);if(s.phase!=='adventure'||!en||en.kind!=='enemy')return false;let e=E[en.key],difficulty=D.difficulties[s.difficulty];delete s.beforeBattle;s.beforeBattle=structuredClone(s);s.phase='combat';s.battle={enemyKey:en.key,isBoss:!!en.boss||!!(regions(s)[s.chapter].bosses||[]).includes(en.key),round:1,active:'player',log:[],last:null,player:unit(s,CL[s.classId].name,s.hp,s.maxHp,s.baseEnergy,s.deck),enemy:unit(s,e.name,Math.ceil(e.hp*difficulty.hp),Math.ceil(e.hp*difficulty.hp),e.energy,e.deck)};s.battle.enemy.bonus=difficulty.damage;s.battle.player.classId=s.classId;s.battle.enemy.classId='enemy';if(s.talents.includes('bulwark'))s.battle.player.block=5;if(s.classId==='fists')s.battle.player.block=s.talents.includes('wall')?4:2;if(s.talents.includes('zeal'))s.battle.player.devotion=3;draw(s,s.battle.player,R.initialHand);draw(s,s.battle.enemy,R.initialHand);s.battle.player.turns=1;log(s,'交战：'+e.name+'。双方起手 3 张。');return true;}
function returnToAdventure(s){
 if(!['combat','defeat'].includes(s.phase))return {ok:false,reason:'当前没有可撤回的战斗'};
 const checkpoint=s.beforeBattle;
 if(checkpoint&&checkpoint.phase==='adventure'&&!checkpoint.beforeBattle){
  const restored=restore(checkpoint);if(!restored)return {ok:false,reason:'战前记录无效'};
  for(const key of Object.keys(s))delete s[key];Object.assign(s,restored);
  return {ok:true,restored:true};
 }
 if(s.phase==='defeat')return {ok:false,reason:'旧存档没有战前记录，无法撤回'};
 // Older V2 saves have no checkpoint. Keep earned campaign state and current wounds.
 s.hp=s.battle.player.hp;s.phase='adventure';s.battle=null;s.reward=null;delete s.beforeBattle;
 return {ok:true,restored:false};
}
function passive(u,id){return u.equipment.filter(x=>C[x].passive===id).length;}
function heal(s,u,n){let amount=Math.min(n,u.maxHp-u.hp);u.hp+=amount;if(amount)log(s,u.name+' 恢复 '+amount+' 点生命。');}
function rawDamage(s,u,n,attr,why){let reduced=attr==='物理'?Math.min(n,passive(u,'armor')):0;n-=reduced;let shield=Math.min(u.block,n);u.block-=shield;n-=shield;u.hp=Math.max(0,u.hp-n);log(s,u.name+' 受到 '+n+' 点'+attr+'伤害'+(reduced||shield?'（减伤 '+(reduced+shield)+'）':'')+' · '+why);return n;}
function directDamage(s,source,target,n,attr){
 if(source.classId==='fists'&&s.talents.includes('siegecraft')&&source.block>=5&&attr==='物理')n++;if(source.classId==='wolf'&&source.firstAttack&&target.vulnerable){n+=s.talents.includes('pack')?2:1;source.firstAttack=false;}n+=source.bonus+(attr==='物理'?passive(source,'aim'):0);if(source.weaken)n=Math.max(0,n-2);if(target.mark){target.mark--;n+=2;if(source.classId==='marine'&&source.firstAttack){n++;source.firstAttack=false;}if(source.classId==='marine'&&s.talents.includes('precision'))n++;log(s,'标记引爆：额外伤害，剩余 '+target.mark+' 层。');}if(target.vulnerable){target.vulnerable--;n+=2;log(s,'破绽触发：伤害 +2。');}
 let reaction=target.prepared;
 if(reaction){target.prepared=null;}else{let idx=target.hand.findIndex(id=>C[id].type==='reaction'&&C[id].cost<=target.energy);if(idx>=0){reaction=target.hand.splice(idx,1)[0];target.energy-=C[reaction].cost;}}
 if(reaction){target.discard.push(reaction);if(C[reaction].reactBlock)target.block+=C[reaction].reactBlock;let reflect=Math.min(n,C[reaction].reflect);n-=reflect;s.battle.reaction={card:reaction,side:target===s.battle.player?'player':'enemy'};log(s,target.name+' 触发「'+C[reaction].name+'」：反射 '+reflect+' 点。');rawDamage(s,source,reflect,attr,'反射，不再触发应对');}
 let dealt=rawDamage(s,target,n,attr,'直接命中');if(source.classId==='blood'&&source.firstAttack&&attr==='物理'&&dealt>0&&source.hp>0){source.firstAttack=false;heal(s,source,s.talents.includes('chalice')?2:1);}return dealt;
}
function cost(s,u,id){return Math.max(0,C[id].cost-(u.classId==='tech'&&u.firstEquip&&C[id].type==='equipment'&&s.talents.includes('cog')?1:0));}
function canPlay(s,side,index){if(s.phase!=='combat'||!s.battle||s.battle.active!==side)return '尚未轮到该单位';let u=s.battle[side],id=u.hand[index],c=C[id];if(!c)return '卡牌不存在';if(u.energy<cost(s,u,id))return '能源不足';if(c.type==='equipment'&&u.equipment.length>=R.equipmentSlots)return '装备位已满，请先卸下装备';if(c.type==='reaction'&&u.prepared)return '已有待命应对';return null;}
function playCard(s,side,index){let reason=canPlay(s,side,index);if(reason)return {ok:false,reason};let b=s.battle,u=b[side],v=b[side==='player'?'enemy':'player'],id=u.hand.splice(index,1)[0],c=C[id];let paid=cost(s,u,id);u.energy-=paid;b.reaction=null;b.last={card:id,side};log(s,u.name+' 使用「'+c.name+'」'+(paid?'，消耗 '+paid+' 能源':'（零费）')+'。');
 if(c.type==='equipment'){u.equipment.push(id);u.firstEquip=false;}else if(c.type==='reaction')u.prepared=id;
 if(c.energy){u.energy+=c.energy;log(s,u.name+' 获得 '+c.energy+' 能源。');}if(c.draw)draw(s,u,c.draw);if(c.heal)heal(s,u,c.heal);if(c.block){u.block+=c.block;log(s,u.name+' 获得 '+c.block+' 护盾。');}
 if(c.cleanse){u.burn=0;u.poison=0;u.weaken=0;u.vulnerable=0;log(s,u.name+' 净化了疫毒、焚烧、虚弱和破绽。');}
 if(c.devotionHeal){heal(s,u,u.devotion*2);u.devotion=0;}if(c.devotion)u.devotion=Math.min(6,u.devotion+c.devotion);
 if(c.cool)u.heat=Math.max(0,u.heat-c.cool);if(c.heat)u.heat=Math.min(9,u.heat+c.heat);
 if(c.recycle&&u.hand.length<R.handLimit){let i=u.discard.findLastIndex(x=>!C[x].recycle);if(i>=0){let recovered=u.discard.splice(i,1)[0];u.hand.push(recovered);log(s,u.name+' 回收「'+C[recovered].name+'」。');}}
 if(c.strip){v.block=0;log(s,v.name+' 的护盾被电磁脉冲清除。');}if(c.enemyCleanse){v.burn=0;v.poison=0;v.weaken=0;log(s,v.name+' 的持续负面状态被净化。');}
 if(c.damage){let amount=c.damage+(c.woundedBonus&&u.hp<=u.maxHp/2?c.woundedBonus:0)+(c.exposedBonus&&v.vulnerable?c.exposedBonus:0)+(c.markedBonus&&v.mark?c.markedBonus:0)+(c.burningBonus&&v.burn?c.burningBonus:0)+(c.blockBonus?Math.floor(u.block/2):0)+(c.heatBonus?u.heat:0);if(c.heatBonus)u.heat=0;for(let hit=0;hit<(c.hits||1)&&u.hp>0&&v.hp>0;hit++){let dealt=directDamage(s,u,v,amount,c.attr);if(c.drain&&u.hp>0)heal(s,u,Math.min(c.drain,dealt));}}
 if(c.poison){v.poison=Math.min(6,(v.poison||0)+c.poison);log(s,v.name+' 疫毒 +'+c.poison+'。');}if(u.classId==='salamander'&&c.attr==='热能'&&u.firstAttack){u.firstAttack=false;v.burn+=s.talents.includes('forgeheart')?2:1;log(s,'锻炉之火：额外施加焚烧。');}if(c.mark){v.mark=Math.min(8,v.mark+c.mark);log(s,v.name+' 被标记 '+c.mark+' 层。');}if(c.vulnerable){v.vulnerable=Math.min(8,v.vulnerable+c.vulnerable);log(s,v.name+' 获得 '+c.vulnerable+' 层破绽。');}if(c.weaken){v.weaken=Math.max(v.weaken,c.weaken);log(s,v.name+' 虚弱 '+c.weaken+' 回合。');}
 if(u.classId==='sister'&&(c.attr==='信仰'||c.attr==='热能')){u.devotion=Math.min(6,u.devotion+1);log(s,'虔诚积累：'+u.devotion+'/6。');}
 if(u.classId==='tech'&&(c.attr==='机械'||c.attr==='电能')&&!c.cool&&!c.heatBonus){u.heat=Math.min(9,u.heat+1);log(s,'反应堆热量：'+u.heat+'。');}

 if(c.burn&&v.hp>0){v.burn+=c.burn;log(s,v.name+' 获得 '+c.burn+' 层焚烧。');}if(c.suppress&&v.hp>0){v.suppress=Math.max(v.suppress,c.suppress);log(s,v.name+' 被压制 '+c.suppress+' 回合。');}
 if(c.selfDamage){u.hp=Math.max(0,u.hp-c.selfDamage);log(s,u.name+' 承受代价，失去 '+c.selfDamage+' 点生命。');}
 if(c.type!=='equipment'&&c.type!=='reaction')u.discard.push(id);if(c.type==='equipment')log(s,'装备「'+c.name+'」部署完成。');s.hp=b.player.hp;checkOutcome(s);return {ok:true};
}
function addExperience(s,xp){s.xp+=xp;while(s.xp>=s.nextLevel){s.xp-=s.nextLevel;s.level++;s.nextLevel+=R.levelXpStep;s.maxHp+=R.levelHp;s.hp=Math.min(s.maxHp,s.hp+R.levelHp);s.baseEnergy=Math.min(R.maxBaseEnergy,R.initialEnergy+Math.floor(s.level/R.energyPerLevels));log(s,'晋升 Lv.'+s.level+'：生命上限 +2、恢复 2；基础能源 '+s.baseEnergy+'。');}}
function checkOutcome(s){if(s.phase!=='combat')return;let b=s.battle;s.hp=b.player.hp;if(b.player.hp<=0){s.phase='defeat';log(s,'生命信号中断。远征失败。');return;}if(b.enemy.hp>0)return;let e=E[b.enemyKey];s.credits+=e.credits;addExperience(s,e.xp);b.player.hp=s.hp;b.player.maxHp=s.maxHp;b.player.baseEnergy=s.baseEnergy;s.battlesWon++;b.active='player';s.reward={credits:e.credits,xp:e.xp,chapterClear:!!s.battle.isBoss||!!(regions(s)[s.chapter].bosses||[]).includes(s.battle.enemyKey)||s.battle.enemyKey===regions(s)[s.chapter].boss,choices:shuffle(s,[...CL[s.classId].rewards,'med','guard','ward','regroup',...(s.campaign!=='crusade'?['detox']:[])]).slice(0,3),taken:false,fieldDressing:false};s.phase=s.reward.chapterClear&&s.chapter===regions(s).length-1?'victory':'reward';if(s.phase==='victory'){s.resolved=s.total;log(s,D.campaigns[s.campaign||'crusade'].ending);}else log(s,'交战结束：获得 '+e.xp+' 战功、'+e.credits+' 军需。');}
function startTurn(s,side){if(s.phase!=='combat')return;let b=s.battle,u=b[side];b.active=side;b.last=null;b.reaction=null;u.firstAttack=true;u.firstEquip=true;u.skillCd=Math.max(0,u.skillCd-1);u.block=u.classId==='fists'?(s.talents.includes('wall')?4:2):0;u.energy=u.baseEnergy+passive(u,'servo');u.turns++;
 if(u.poison){let tick=u.poison;u.poison--;u.hp=Math.max(0,u.hp-tick);log(s,u.name+' 疫毒损失 '+tick+' 生命，剩余 '+u.poison+' 层。');checkOutcome(s);if(s.phase!=='combat')return;}
 if(u.burn){let tick=u.burn;u.burn--;u.hp=Math.max(0,u.hp-tick);log(s,u.name+' 焚烧损失 '+tick+' 点生命（无视护盾），剩余 '+u.burn+' 层。');checkOutcome(s);if(s.phase!=='combat')return;}
 let count=u.turns===1?R.firstTurnDraw:R.drawPerTurn;if(u.suppress){count=Math.max(0,count-1);u.suppress--;log(s,u.name+' 受压制，本回合少抽 1 张。');}if(count)draw(s,u,count);log(s,u.name+' 回合开始：能源 '+u.energy+'/'+u.baseEnergy+'。');
 if(side==='enemy'){
 let trait=E[b.enemyKey].trait;if(u.turns%3===0){if(trait==='mark')b.player.mark=Math.min(8,b.player.mark+2);if(trait==='fire')b.player.burn+=2;if(['curse','final'].includes(trait))b.player.weaken=2;if(trait)log(s,u.name+' 战术能力触发：'+E[b.enemyKey].tactic+'。');}
 if(trait==='final'&&!u.enraged&&u.hp<=u.maxHp/2){u.enraged=true;u.block+=6;u.energy++;draw(s,u,2);log(s,'裂隙守望者进入第二阶段：护盾 +6，额外抽 2 张，能源 +1。');}
 if(u.turns>=14&&u.turns%3===0){u.bonus++;log(s,'战斗拖延：敌方火力升级，直接攻击加成 '+u.bonus+'。');}
 }
}

function endEffects(s,u){if(s.phase!=='combat')return;let other=u===s.battle.player?s.battle.enemy:s.battle.player;let faith=passive(u,'faith');if(faith)heal(s,u,faith);if(u.weaken)u.weaken--;let drones=passive(u,'drone');for(let i=0;i<drones&&other.hp>0;i++)directDamage(s,u,other,2,'物理');if(passive(u,'censor')&&other.burn)other.vulnerable=Math.min(8,other.vulnerable+passive(u,'censor'));if(u.classId==='tech'&&u.heat>(s.talents.includes('sink')?6:4)){u.hp=Math.max(0,u.hp-3);u.heat=2;log(s,'反应堆过热：损失 3 生命，热量回落至 2。');}checkOutcome(s);}

function enemyTurn(s){if(s.phase!=='combat')return;let u=s.battle.enemy;
 for(let attempts=0;attempts<40&&s.phase==='combat';attempts++){
 let options=u.hand.map((id,i)=>({id,i,c:C[id]})).filter(x=>!canPlay(s,'enemy',x.i)&&x.c.type!=='reaction');
 options=options.filter(x=>!(x.c.heal&&u.hp===u.maxHp&&!x.c.block)&&!(x.c.energy&&!x.c.draw&&!u.hand.some(id=>C[id].cost>u.energy)));
 options.sort((a,b)=>score(b.c,u,s.battle.player)-score(a.c,u,s.battle.player));if(!options.length)break;playCard(s,'enemy',options[0].i);
 }
}
function score(c,u,target){if(c.mark&&!target.mark)return 88;if(c.weaken&&!target.weaken)return 72;if(c.damage&&target.hp<=c.damage)return 110;return c.energy?100:c.heal&&u.hp<u.maxHp/2?90:c.type==='equipment'?75:c.damage?50+c.damage:c.heal?20:10;}
function endTurn(s){if(s.phase!=='combat'||s.battle.active!=='player')return false;endEffects(s,s.battle.player);startTurn(s,'enemy');enemyTurn(s);if(s.phase==='combat'){endEffects(s,s.battle.enemy);s.battle.round++;s.turns++;startTurn(s,'player');}if(s.battle)s.hp=s.battle.player.hp;return true;}
function discard(s,index){if(s.phase!=='combat'||s.battle.active!=='player')return false;let u=s.battle.player;if(!u.hand[index])return false;let id=u.hand.splice(index,1)[0];u.discard.push(id);log(s,'手动弃置「'+C[id].name+'」。');return true;}
function unequip(s,index){if(s.phase!=='combat'||s.battle.active!=='player')return false;let u=s.battle.player;if(!u.equipment[index])return false;let id=u.equipment.splice(index,1)[0];u.discard.push(id);log(s,'卸下「'+C[id].name+'」，移入坟场。');return true;}
function useItem(s){if(s.phase==='combat'&&s.battle.active!=='player')return {ok:false,reason:'等待你的回合'};if(!['adventure','combat'].includes(s.phase)||!s.backpack.length)return {ok:false,reason:'没有可用补给'};let hp=s.phase==='combat'?s.battle.player.hp:s.hp;if(hp>=s.maxHp)return {ok:false,reason:'生命已满，补给已保留'};s.backpack.shift();if(s.phase==='combat'){heal(s,s.battle.player,6);s.hp=s.battle.player.hp;}else{s.hp=Math.min(s.maxHp,s.hp+6);log(s,'使用医疗包，恢复 6 点生命。');}return {ok:true};}
function eventAction(s,action,value){let en=encounter(s);if(s.phase!=='adventure'||!en||en.kind!=='event')return {ok:false,reason:'请先选择事件'};let key=en.key;
 if(action==='leave'){log(s,'离开「'+EV[key].name+'」。');completeEncounter(s);return {ok:true};}
 if(key==='medbay'){
  if(action==='heal'){s.hp=Math.min(s.maxHp,s.hp+R.healAmount);log(s,'接受战地救护，恢复最多 8 点生命。');}
  else if(action==='kit'){if(s.backpack.length>=R.backpackSlots)return {ok:false,reason:'背包已满，请先使用补给'};s.backpack.push('medkit');log(s,'获得医疗包。');}else return {ok:false};
 }else if(key==='armory'){
  let allowed=armoryOffers(s);if(action!=='take'||!allowed.includes(value))return {ok:false};s.deck.push(value);log(s,'军械库：获得「'+C[value].name+'」。');
 }else if(key==='forge'){
 if(action!=='upgrade'||!Number.isInteger(value)||!D.upgrades[s.deck[value]])return {ok:false,reason:'选择未强化的攻击牌'};if(s.credits<8)return {ok:false,reason:'需要 8 军需'};s.credits-=8;s.deck[value]=D.upgrades[s.deck[value]];log(s,'军械强化：'+C[s.deck[value]].name+'。');
 }else if(key==='training'){
 if(action!=='talent'||!D.talents[s.classId].some(t=>t.id===value)||s.talents.includes(value))return {ok:false,reason:'该专精不可选择'};s.talents.push(value);log(s,'掌握永久专精：'+D.talents[s.classId].find(t=>t.id===value).name+'。');
 }else if(key==='purge'){
  if(action!=='remove'||!Number.isInteger(value)||!s.deck[value])return {ok:false};if(s.credits<R.removeCost)return {ok:false,reason:'军需不足'};if(s.deck.length<=5)return {ok:false,reason:'作战牌组至少保留 5 张牌'};s.credits-=R.removeCost;let id=s.deck.splice(value,1)[0];log(s,'战术重整：花费 5 军需，移除「'+C[id].name+'」。');
 }else if(key==='fork'){
  if(action!=='reroute')return {ok:false};let rest=s.field.filter(x=>x.uid!==en.uid);s.queue=shuffle(s,[...rest,...s.queue]);s.field=[en];log(s,'改走维修通道：其余遭遇已放回并重新洗牌。');
 }else if(key==='shrine'){
  if(action!=='relic')return {ok:false};if(s.hp<=3)return {ok:false,reason:'伤势过重，无法承受电击'};s.hp-=3;s.credits+=5;s.deck.push('icon');log(s,'回收圣匣：失去 3 生命，获得圣像与 5 军需。');
 }else if(key==='merchant'){
  let prices={med:6,regroup:7,deflect:7,sight:9,crossfire:10,lastStand:10,requisitionKit:8};if(action==='heal'){if(s.credits<5)return {ok:false,reason:'需要5军需'};s.credits-=5;s.hp=Math.min(s.maxHp,s.hp+4);log(s,'军需站：支付5军需进行战地维护，恢复4生命。');}else{if(action!=='buy'||!prices[value])return {ok:false};if(s.credits<prices[value])return {ok:false,reason:'军需不足'};s.credits-=prices[value];s.deck.push(value);log(s,'军需站：购买「'+C[value].name+'」，支付 '+prices[value]+' 军需。');}
 }else return {ok:false};completeEncounter(s);return {ok:true};
}
function claimReward(s){if(s.phase!=='reward')return false;completeEncounter(s);return true;}
function rewardDressing(s){
 if(s.phase!=='reward'||!s.reward||s.reward.fieldDressing)return {ok:false,reason:'这次战后整备已经使用'};
 if(s.credits<6)return {ok:false,reason:'需要 6 军需进行战地维护'};
 if(s.hp>=s.maxHp)return {ok:false,reason:'生命已满，无需维护'};
 s.credits-=6;let before=s.hp;s.hp=Math.min(s.maxHp,s.hp+5);s.reward.fieldDressing=true;
 log(s,'战后整备：支付 6 军需，恢复 '+(s.hp-before)+' 生命。');
 return {ok:true,amount:s.hp-before};
}

function armoryOffers(s){let pool=CL[s.classId].rewards;let offers=Array.from({length:3},(_,i)=>pool[(s.chapter*3+i)%pool.length]);if(s.campaign==='nurgle')offers[2]='detox';return offers;}
function chooseReward(s,id){if(s.phase!=='reward'||s.reward.taken||!s.reward.choices.includes(id))return false;s.deck.push(id);s.reward.taken=true;log(s,'战利品：获得「'+C[id].name+'」。');return true;}
function skillReason(s){if(s.phase!=='combat'||s.battle.active!=='player')return '等待你的回合';let u=s.battle.player,k=D.skills[s.classId];if(u.skillCd)return '冷却 '+u.skillCd+' 回合';if(u.energy<k.cost)return '能源不足';if(s.classId==='sister'&&u.devotion<3)return '需要 3 虔诚';return null;}
function useSkill(s){let reason=skillReason(s);if(reason)return {ok:false,reason};let u=s.battle.player,v=s.battle.enemy,k=D.skills[s.classId];u.energy-=k.cost;u.skillCd=k.cooldown;s.battle.last={skill:s.classId,side:'player'};s.battle.reaction=null;log(s,u.name+' 发动技能「'+k.name+'」。');if(s.classId==='marine'){v.mark=Math.min(8,v.mark+2);draw(s,u,1);log(s,'锁敌完成：标记 +2。');}else if(s.classId==='sister'){u.devotion-=3;heal(s,u,4+(s.talents.includes('mercy')?3:0));v.burn+=2;log(s,'圣火祈愿：敌方焚烧 +2。');}else if(s.classId==='tech'){let heat=u.heat;u.block+=heat+2;heal(s,u,Math.min(3,heat));u.mark=0;u.heat=0;draw(s,u,1);log(s,'紧急泄压：热量转化为护盾与修复，清除标记。');}if(!['marine','sister','tech'].includes(s.classId)){if(k.cleanse){u.poison=0;u.burn=0;u.weaken=0;u.vulnerable=0;}if(k.block)u.block+=k.block;if(k.burn)v.burn+=k.burn;if(k.vulnerable)v.vulnerable=Math.min(8,v.vulnerable+k.vulnerable);if(k.draw)draw(s,u,k.draw);if(k.damage){let dealt=directDamage(s,u,v,k.damage+(s.talents.includes('descent')?2:0),'物理');if(u.hp>0)heal(s,u,Math.min(k.drain||0,dealt));}if(s.talents.includes('protector'))heal(s,u,3);if(s.talents.includes('hunter'))u.block+=3;log(s,k.name+' 效果已结算。');checkOutcome(s);}s.hp=u.hp;return {ok:true};}
function capture(s,fn){let frames=[];let prior=observer;observer=(state,text)=>{if(state.battle)frames.push({state:JSON.parse(JSON.stringify(state)),text,reveal:text.includes(' 使用「')||text.includes('发动技能')});};let result;try{result=fn();}finally{observer=prior;}return {frames,result};}
function restore(raw){try{let s=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);const validCards=a=>Array.isArray(a)&&a.length<=500&&a.every(id=>!!C[id]);const validEnc=a=>Array.isArray(a)&&a.length<=40&&a.every(e=>e&&typeof e.uid==='string'&&((e.kind==='enemy'&&E[e.key])||(e.kind==='event'&&EV[e.key])));if(s&&s.campaign===undefined)s.campaign='crusade';if(!s||!D.campaigns[s.campaign]||s.version!==R.version||!CL[s.classId]||!D.difficulties[s.difficulty]||!Number.isInteger(s.chapter)||s.chapter<0||s.chapter>2||!Array.isArray(s.talents)||!s.talents.every(t=>D.talents[s.classId].some(x=>x.id===t))||!['adventure','combat','reward','defeat','victory'].includes(s.phase)||!validCards(s.deck)||!Array.isArray(s.history)||!Array.isArray(s.backpack)||!s.backpack.every(x=>x==='medkit')||!validEnc(s.queue)||!validEnc(s.field))return null;for(let n of ['hp','maxHp','credits','level','xp','nextLevel','baseEnergy','rng','resolved','total'])if(!Number.isFinite(s[n])||s[n]<0)return null;if(s.maxHp<1||s.hp>s.maxHp||s.nextLevel<1)return null;if(s.phase==='combat'||s.phase==='reward'){let b=s.battle;if(!b||!E[b.enemyKey]||!Array.isArray(b.log)||b.active!=='player')return null;for(let side of ['player','enemy']){let u=b[side];if(u&&u.poison===undefined)u.poison=0;if(!u||!validCards(u.hand)||!validCards(u.draw)||!validCards(u.discard)||!validCards(u.equipment)||u.hand.length>R.handLimit||u.equipment.length>R.equipmentSlots)return null;for(let n of ['hp','maxHp','energy','baseEnergy','block','burn','poison','suppress','turns','mark','vulnerable','weaken','devotion','heat','skillCd'])if(!Number.isFinite(u[n])||u[n]<0)return null;}}return s;}catch{return null;}}
const api={regions,newRun,select,encounter,beginBattle,returnToAdventure,canPlay,playCard,endTurn,discard,unequip,useItem,eventAction,claimReward,rewardDressing,restore,draw,checkOutcome,armoryOffers,chooseReward,useSkill,skillReason,capture,cost};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GAME=api;
})(typeof globalThis!=='undefined'?globalThis:this);
