'use strict';
const G=require('../engine'),D=require('../data');
const priorities={marine:{burst:12,execute:13,designate:8,fortress:8,med:9,breach:9},sister:{judgment:13,inferno:12,absolution:11,litany:8,prayer:7},tech:{discharge:14,coolant:11,drone:12,patch:8,emp:9}};
function simulate(cls,seed,difficulty='veteran'){
 let s=G.newRun(cls,seed,difficulty),steps=0,turnActions=0;
 while(!['victory','defeat'].includes(s.phase)&&steps++<2400){
 if(s.phase==='adventure'){
 let en=s.field.find(e=>e.key==='medbay'&&s.maxHp-s.hp>=6)||s.field.find(e=>['armory','training','forge'].includes(e.key))||s.field.find(e=>e.kind==='enemy')||s.field[0];G.select(s,en.uid);
 if(en.kind==='enemy'){if(s.maxHp-s.hp>=6)G.useItem(s);G.beginBattle(s);turnActions=0;}
 else if(en.key==='armory'){let choices=G.armoryOffers(s).sort((a,b)=>((priorities[cls]||{})[b]||0)-((priorities[cls]||{})[a]||0));G.eventAction(s,'take',choices[0]);}
 else if(en.key==='medbay')G.eventAction(s,'heal');
 else if(en.key==='training'){let t=D.talents[cls].find(t=>!s.talents.includes(t.id));G.eventAction(s,t?'talent':'leave',t?.id);}
 else if(en.key==='forge'){let i=s.deck.map((id,i)=>({id,i})).filter(x=>D.upgrades[x.id]).sort((a,b)=>((priorities[cls]||{})[b.id]||0)-((priorities[cls]||{})[a.id]||0))[0]?.i;let r=G.eventAction(s,'upgrade',i);if(!r.ok)G.eventAction(s,'leave');}
 else if(en.key==='purge'){let i=s.deck.indexOf('strike');let r=G.eventAction(s,'remove',i);if(!r.ok)G.eventAction(s,'leave');}
 else if(en.key==='merchant'){if(s.deck.filter(x=>x==='med').length<2){if(!G.eventAction(s,'buy','med').ok)G.eventAction(s,'leave');}else G.eventAction(s,'leave');}
 else G.eventAction(s,'leave');
 }else if(s.phase==='reward'){
 let choices=[...s.reward.choices].filter(id=>s.deck.filter(x=>x===id).length<2&&((priorities[cls]||{})[id]||1)>0).sort((a,b)=>((priorities[cls]||{})[b]||0)-((priorities[cls]||{})[a]||0));if(choices.length&&s.deck.length<15)G.chooseReward(s,choices[0]);G.claimReward(s);
 }else{
 let u=s.battle.player,v=s.battle.enemy;if(u.maxHp-u.hp>=6)G.useItem(s);
 let options=u.hand.map((id,i)=>({id,i,c:D.cards[id]})).filter(x=>!G.canPlay(s,'player',x.i)&&x.c.type!=='reaction').filter(x=>!(x.c.heal&&u.hp===u.maxHp&&!x.c.block)&&!(x.c.energy&&!x.c.draw&&!u.hand.some(id=>D.cards[id].cost>u.energy))&&!(x.c.mark&&v.mark>=3)&&!(x.c.cool&&u.heat===0)&&!(x.c.recycle&&!u.discard.length));
 let useClassSkill=(cls==='marine'&&v.mark===0&&(u.energy>=2||u.hand.includes('strike')))||(cls==='sister'&&(u.hp<u.maxHp-2||v.burn===0))||(cls==='tech'&&(u.mark>0||(u.heat>=2&&(u.hp<u.maxHp-2||!options.some(x=>x.c.heatBonus)))||!options.length))||(cls==='blood'&&u.energy>=1&&u.hp<u.maxHp-5)||(cls==='fists'&&u.block<3&&v.hp>u.hp/2)||(cls==='salamander'&&u.energy>=1&&(u.hp<u.maxHp-4||(!v.burn&&!options.some(x=>x.c.damage))))||(cls==='wolf'&&u.energy>=1&&!v.vulnerable&&!options.some(x=>x.c.damage));if(!G.skillReason(s)&&useClassSkill){G.useSkill(s);continue;}
 function rank(c){if(c.damage>=v.hp)return 200;if(c.energy)return 110;if(c.cleanse&&(u.poison||u.burn||u.weaken||u.vulnerable))return 145;if(c.heal&&u.hp<u.maxHp/2)return 100;if(c.mark&&!v.mark)return 95;if(c.type==='equipment')return 85;if(c.cool&&u.heat>4)return 90;if(c.damage)return 50+c.damage+(c.heatBonus?u.heat:0)+(c.markedBonus&&v.mark?c.markedBonus:0)+(c.burningBonus&&v.burn?c.burningBonus:0)+(c.woundedBonus&&u.hp<=u.maxHp/2?c.woundedBonus:0)+(c.exposedBonus&&v.vulnerable?c.exposedBonus:0);if(c.devotion&&u.devotion<3)return 70;return 20;}
 options.sort((a,b)=>rank(b.c)-rank(a.c));if(options.length&&turnActions++<35)G.playCard(s,'player',options[0].i);else{G.endTurn(s);turnActions=0;}
 }
 if(steps%13===0){let restored=G.restore(s);if(!restored)throw Error('Save rejected at '+s.phase);s=restored;}
 }
 if(steps>=2400)throw Error('Run stalled');return s;
}
if(require.main===module){for(let diff of ['story','veteran','nightmare'])for(let cls of Object.keys(D.classes)){let wins=0,progress=0;for(let i=1;i<=20;i++){let s=simulate(cls,(i*2654435761)>>>0,diff);wins+=s.phase==='victory';progress+=s.resolved;}console.log(diff,cls,wins+'/20 wins','mean progress',(progress/20).toFixed(1));}}
module.exports=simulate;
