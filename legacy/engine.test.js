'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),G=require('../engine'),D=require('../data');
function battle(cls='marine',seed=42){let s=G.newRun(cls,seed);G.select(s,s.field.find(x=>x.kind==='enemy').uid);G.beginBattle(s);return s;}
function cards(s,p,e=[]){s.battle.player.hand=p;s.battle.enemy.hand=e;}
function play(s,i=0){return G.playCard(s,'player',i);}
test('three classes have valid ten-card initial decks and three encounters',()=>{for(let id of Object.keys(D.classes)){let s=G.newRun(id,4);assert.equal(s.deck.length,10);assert.equal(s.field.length,3);assert.equal(s.credits,25);assert.equal(s.backpack.length,1);assert.ok(s.deck.every(c=>D.cards[c]));}});
test('same seed produces identical shuffled combat decks',()=>{assert.deepEqual(battle('marine',8).battle.player.draw,battle('marine',8).battle.player.draw);});
test('initial hand three, insufficient energy does not mutate state',()=>{let s=battle();assert.equal(s.battle.player.hand.length,3);cards(s,['overload']);let before=JSON.stringify(s);assert.equal(play(s).ok,false);assert.equal(JSON.stringify(s),before);});
test('temporary energy exceeds base and card is sent to discard',()=>{let s=battle();cards(s,['regroup']);play(s);assert.equal(s.battle.player.energy,3);assert.equal(s.battle.player.baseEnergy,1);assert.ok(s.battle.player.discard.includes('regroup'));});
test('unplayed hand persists, two cards drawn, energy resets next own turn',()=>{let s=battle();cards(s,['overload']);s.battle.player.energy=9;s.battle.enemy.draw=[];s.battle.enemy.discard=[];s.battle.player.draw=['med','guard','strike'];G.endTurn(s);assert.deepEqual(s.battle.player.hand,['overload','med','guard']);assert.equal(s.battle.player.energy,1);});
test('draw honors limit ten and recycles discard only when empty',()=>{let s=battle(),u=s.battle.player;u.hand=Array(9).fill('strike');u.draw=[];u.discard=['regroup','med'];G.draw(s,u,4);assert.equal(u.hand.length,10);assert.equal(u.draw.length,1);assert.equal(u.discard.length,0);});
test('direct attack triggers one reaction, no recursive reflection',()=>{let s=battle();cards(s,['strike','deflect'],['deflect','deflect']);let hp=s.hp;play(s);assert.equal(s.battle.player.hp,hp-2);assert.equal(s.battle.enemy.hp,10);assert.deepEqual(s.battle.enemy.hand,['deflect']);assert.deepEqual(s.battle.player.hand,['deflect']);});
test('prepared reaction takes precedence over reaction in hand',()=>{let s=battle();cards(s,['strike'],['deflect']);s.battle.enemy.prepared='deflect';play(s);assert.equal(s.battle.enemy.prepared,null);assert.equal(s.battle.enemy.hand.length,1);});
test('physical armor applies after reflection; elemental damage ignores armor',()=>{let s=battle();cards(s,['bolter','flame']);s.battle.player.energy=3;s.battle.enemy.equipment=['armor'];play(s);assert.equal(s.battle.enemy.hp,7);play(s);assert.equal(s.battle.enemy.hp,4);});
test('equipment slots enforced, unequip moves card to discard',()=>{let s=battle();cards(s,['sight']);s.battle.player.equipment=['armor','servitor'];assert.equal(play(s).ok,false);G.unequip(s,0);assert.equal(play(s).ok,true);assert.ok(s.battle.player.discard.includes('armor'));assert.equal(s.battle.player.equipment.length,2);});
test('enemy uses actual hand and pays the same costs',()=>{let s=battle();cards(s,[],['overload','bolter']);s.battle.enemy.draw=[];s.battle.enemy.discard=[];G.endTurn(s);assert.deepEqual(s.battle.enemy.hand,['overload']);assert.equal(s.battle.enemy.energy,0);assert.ok(s.battle.enemy.discard.includes('bolter'));assert.equal(s.hp,s.maxHp-4);});
test('burn ticks through armor, reduces one stack and may win before enemy acts',()=>{let s=battle();cards(s,[],['bolter']);s.battle.enemy.hp=2;s.battle.enemy.burn=2;s.battle.enemy.block=10;s.battle.enemy.equipment=['armor'];G.endTurn(s);assert.equal(s.phase,'reward');assert.equal(s.hp,s.maxHp);});
test('suppression reduces next draw, then expires',()=>{let s=battle(),u=s.battle.player;cards(s,[]);s.battle.enemy.draw=[];u.suppress=1;G.endTurn(s);assert.equal(u.hand.length,1);assert.equal(u.suppress,0);});
test('rewards grant exactly once; claim is idempotent and injuries persist',()=>{let s=battle();cards(s,['strike']);s.battle.enemy.hp=2;s.battle.player.hp=12;play(s);assert.equal(s.phase,'reward');assert.equal(s.credits,30);G.checkOutcome(s);assert.equal(s.credits,30);assert.ok(G.claimReward(s));assert.equal(G.claimReward(s),false);assert.equal(s.hp,12);assert.equal(s.resolved,1);assert.equal(s.field.length,3);});
test('level-up heals persist even when killing enemy during end-turn',()=>{let s=battle();s.xp=1;s.battle.player.hp=10;s.battle.enemy.hp=1;s.battle.enemy.burn=1;G.endTurn(s);assert.equal(s.level,2);assert.equal(s.hp,13);assert.equal(s.battle.player.hp,13);assert.equal(s.maxHp,29);assert.equal(s.baseEnergy,2);});
test('reflection can kill player and ends the run; simultaneous death is defeat',()=>{let s=battle();cards(s,['bolter'],['deflect']);s.battle.player.hp=1;s.battle.enemy.hp=2;play(s);assert.equal(s.phase,'defeat');assert.equal(s.credits,25);});
test('discard hand and inspect saved state conserve the card',()=>{let s=battle();let id=s.battle.player.hand[0];assert.ok(G.discard(s,0));assert.ok(s.battle.player.discard.includes(id));assert.equal(s.battle.player.hand.length,2);assert.deepEqual(G.restore(JSON.stringify(s)),s);});
test('backpack cannot waste medkit at full HP; consuming item persists',()=>{let s=G.newRun('marine',2);assert.equal(G.useItem(s).ok,false);assert.equal(s.backpack.length,1);s.hp-=9;G.useItem(s);assert.equal(s.hp,s.maxHp-3);assert.equal(s.backpack.length,0);});
function selectEvent(s,key){let e=s.field.find(e=>e.key===key);if(!e){let i=s.queue.findIndex(e=>e.key===key);e=s.queue.splice(i,1)[0];s.field.push(e);}G.select(s,e.uid);return e;}
test('delete event removes exactly one card and charges once',()=>{let s=G.newRun('marine',1);selectEvent(s,'purge');let id=s.deck[0],before=s.deck.filter(x=>x===id).length;assert.ok(G.eventAction(s,'remove',0).ok);assert.equal(s.credits,20);assert.equal(s.deck.length,9);assert.equal(s.deck.filter(x=>x===id).length,before-1);assert.equal(G.eventAction(s,'remove',0).ok,false);});
test('armory and merchant enforce their offer lists and prices',()=>{let s=G.newRun('marine',1);selectEvent(s,'armory');assert.equal(G.eventAction(s,'take','hex').ok,false);G.eventAction(s,'take','chainsword');assert.ok(s.deck.includes('chainsword'));selectEvent(s,'merchant');s.credits=0;assert.equal(G.eventAction(s,'buy','sight').ok,false);assert.equal(s.deck.length,11);s.credits=9;G.eventAction(s,'buy','sight');assert.equal(s.credits,0);assert.equal(s.deck.length,12);});
test('fork conserves all unresolved encounters without duplicate ids',()=>{let s=G.newRun('marine',1);selectEvent(s,'fork');let before=[...s.field,...s.queue].map(x=>x.uid).sort();let selected=s.selected;G.eventAction(s,'reroute');let after=[...s.field,...s.queue].map(x=>x.uid).sort();assert.deepEqual(after,before.filter(x=>x!==selected));assert.equal(new Set(after).size,after.length);});
test('invalid or incompatible saves rejected without throwing',()=>{for(let x of ['invalid','{}',JSON.stringify({version:999}),null])assert.equal(G.restore(x),null);let s=battle();s.battle.player.energy=-1;assert.equal(G.restore(s),null);});
// Full runs use only public actions: no injected health, currency or cards.
function autoRun(classId,seed){let s=G.newRun(classId,seed),safety=0;while(!['victory','defeat'].includes(s.phase)&&safety++<1400){
 if(s.phase==='adventure'){
  let selected=s.field.find(x=>x.key==='medbay'&&s.maxHp-s.hp>=6)||s.field.find(x=>['armory','merchant'].includes(x.key))||s.field.find(x=>x.kind==='enemy')||s.field[0];G.select(s,selected.uid);
  if(selected.kind==='enemy'){if(s.hp<s.maxHp-6&&s.backpack.length)G.useItem(s);G.beginBattle(s);}
  else if(selected.key==='armory'){let choice=classId==='marine'?'chainsword':classId==='sister'?'inferno':'scan';G.eventAction(s,'take',choice);}
  else if(selected.key==='merchant'){let r=G.eventAction(s,'buy','med');if(!r.ok)G.eventAction(s,'leave');}
  else if(selected.key==='purge'){let r=G.eventAction(s,'remove',s.deck.indexOf('strike'));if(!r.ok)G.eventAction(s,'leave');}
  else if(selected.key==='medbay')G.eventAction(s,'heal');else G.eventAction(s,'leave');
 }else if(s.phase==='reward')G.claimReward(s);
 else if(s.phase==='combat'){
  let u=s.battle.player;if(u.hp<=u.maxHp-6&&s.backpack.length)G.useItem(s);
  let options=u.hand.map((id,i)=>({id,i,c:D.cards[id]})).filter(x=>!G.canPlay(s,'player',x.i)&&x.c.type!=='reaction').filter(x=>!(x.c.heal&&u.hp===u.maxHp&&!x.c.block)&&!(x.c.energy&&!x.c.draw&&!u.hand.some(id=>D.cards[id].cost>u.energy)));
  const score=c=>c.energy?100:c.heal&&u.hp<u.maxHp/2?95:c.type==='equipment'?85:c.damage?50+c.damage:c.heal?25:10;
  options.sort((a,b)=>score(b.c)-score(a.c));if(options.length)G.playCard(s,'player',options[0].i);else G.endTurn(s);
 }
 if(safety%7===0){let restored=G.restore(JSON.stringify(s));assert.ok(restored,'save reload valid during campaign');s=restored;}
 }
 assert.ok(safety<1400,'campaign terminates');return s;
}
test('all three classes can reach victory through complete public game flows',()=>{for(let id of Object.keys(D.classes)){let wins=0;for(let seed=1;seed<=30;seed++){let s=autoRun(id,(seed*2654435761)>>>0);assert.ok(['victory','defeat'].includes(s.phase));if(s.phase==='victory'){wins++;assert.equal(s.resolved,13);assert.equal(s.battlesWon,5);}}console.log(id+' balance: '+wins+'/30 wins');assert.ok(wins>=20,id+' should be viable for the first expedition');}});
