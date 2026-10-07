(function(root){
'use strict';
const RULES={version:1,initialHand:3,drawPerTurn:2,handLimit:10,equipmentSlots:2,backpackSlots:1,initialCredits:25,removeCost:5,healAmount:8,initialEnergy:1,levelHp:3,levelXpStart:2,levelXpStep:1,energyPerLevels:2,firstTurnDraw:0,shuffleDiscard:true};
const cards={
 strike:{name:'战斗刀突刺',cost:0,type:'attack',attr:'物理',damage:2,art:'knife',text:'造成 2 点物理伤害。'},
 bolter:{name:'爆弹齐射',cost:1,type:'attack',attr:'物理',damage:4,art:'bolter',text:'造成 4 点物理伤害。'},
 flame:{name:'焚烧器喷射',cost:1,type:'attack',attr:'热能',damage:3,art:'flame',text:'造成 3 点热能伤害。'},
 inferno:{name:'净化烈焰',cost:2,type:'attack',attr:'热能',damage:4,burn:2,art:'flame',text:'造成 4 点热能伤害，施加 2 层焚烧。'},
 regroup:{name:'战术整备',cost:0,type:'skill',attr:'战术',energy:2,art:'eagle',text:'获得 2 点能源。可暂时超过基础值。'},
 deflect:{name:'偏转力场',cost:0,type:'reaction',attr:'应对',reflect:2,art:'shield',text:'受直接攻击时自动打出，反射最多 2 点伤害。也可提前部署。每次受击限一张。'},
 armor:{name:'动力甲组件',cost:1,type:'equipment',attr:'装备',passive:'armor',art:'armor',text:'装备：每次受到物理伤害减少 1 点。'},
 sight:{name:'瞄准阵列',cost:1,type:'equipment',attr:'装备',passive:'aim',art:'scope',text:'装备：你的物理攻击伤害 +1。'},
 med:{name:'医疗针剂',cost:1,type:'skill',attr:'医疗',heal:5,art:'med',text:'恢复 5 点生命，不超过生命上限。'},
 prayer:{name:'不屈祷言',cost:0,type:'skill',attr:'信仰',heal:2,block:2,art:'chalice',text:'恢复 2 点生命，获得 2 点护盾。护盾持续至下次己方回合开始。'},
 icon:{name:'殉道者圣像',cost:1,type:'equipment',attr:'装备',passive:'faith',art:'chalice',text:'装备：己方每回合结束时恢复 1 点生命。'},
 arc:{name:'电弧放射',cost:1,type:'attack',attr:'电能',damage:3,art:'arc',text:'造成 3 点电能伤害。'},
 stasis:{name:'停滞力场',cost:2,type:'attack',attr:'电能',damage:4,suppress:2,art:'stasis',text:'造成 4 点电能伤害。压制 2 回合：目标每回合少抽 1 张牌。'},
 servitor:{name:'能源伺服颅骨',cost:1,type:'equipment',attr:'装备',passive:'servo',art:'skull',text:'装备：己方回合开始，额外获得 1 点能源。'},
 patch:{name:'战地修复',cost:0,type:'skill',attr:'机械',heal:3,art:'gear',text:'恢复 3 点生命。'},
 scan:{name:'机魂检索',cost:0,type:'skill',attr:'机械',draw:1,energy:1,art:'scope',text:'抽 1 张牌，获得 1 点能源。'},
 overload:{name:'等离子过载',cost:2,type:'attack',attr:'电能',damage:6,selfDamage:1,art:'plasma',text:'造成 6 点电能伤害，自身失去 1 点生命。'},
 chainsword:{name:'链锯剑横斩',cost:1,type:'attack',attr:'物理',damage:5,art:'chainsword',text:'造成 5 点物理伤害。'},
 guard:{name:'掩体部署',cost:0,type:'skill',attr:'战术',block:3,art:'shield',text:'获得 3 点护盾，持续至下次己方回合开始。'},
 hex:{name:'亚空间灼蚀',cost:1,type:'attack',attr:'亚空间',damage:2,burn:1,art:'chaos',text:'造成 2 点亚空间伤害，施加 1 层焚烧。'}
};
const classes={
 marine:{name:'星际战士',subtitle:'阿斯塔特 · 战术兄弟',latin:'ADEPTUS ASTARTES',color:'#9dafa8',resource:'战术能源',hp:26,art:'marine',quote:'以钢铁为誓，以职责为盾。',description:'爆弹与链锯剑开路，动力甲承受反击。稳定的武装，可靠的火力。',tags:['物理火力','动力装甲'],deck:['strike','strike','strike','bolter','bolter','regroup','regroup','deflect','armor','med'],rewards:['chainsword','sight','armor']},
 sister:{name:'战斗修女',subtitle:'战斗修女会 · 净化者',latin:'ADEPTA SORORITAS',color:'#bc7267',resource:'战术能源',hp:24,art:'sister',quote:'让信仰照亮最后的黑夜。',description:'以烈焰清除异端，以祷言维持战线。圣像与恢复带来持久作战能力。',tags:['净化烈焰','信仰恢复'],deck:['strike','strike','strike','flame','flame','flame','regroup','prayer','icon','deflect'],rewards:['inferno','icon','med']},
 tech:{name:'技术神甫',subtitle:'机械修会 · 探索贤者',latin:'ADEPTUS MECHANICUS',color:'#b6a070',resource:'反应堆能源',hp:23,art:'tech',quote:'血肉易逝，知识永存。',description:'调度能源，唤醒机魂。用机械支援与等离子火力构建高效循环。',tags:['能源调度','机械协同'],deck:['strike','strike','arc','arc','regroup','scan','deflect','servitor','patch','overload'],rewards:['stasis','scan','servitor']}
};
const enemies={
 cultist:{name:'灰烬教徒',title:'巢都外围 · 异端民兵',level:1,hp:10,energy:1,art:'cultist',xp:1,credits:5,description:'拾荒者的长袍下藏着刻满亵渎符号的利刃。',deck:['strike','strike','strike','flame','regroup','guard','deflect']},
 rebel:{name:'叛变卫军',title:'物资轨道 · 叛军哨站',level:1,hp:10,energy:1,art:'rebel',xp:1,credits:6,description:'他们仍穿着帝国军装，却已将枪口转向昔日同袍。',deck:['strike','strike','bolter','regroup','guard','armor','strike','deflect']},
 husk:{name:'失控机仆',title:'装配车间 · 污染机械',level:2,hp:12,energy:1,art:'servitorEnemy',xp:2,credits:7,description:'残破的机魂在重复一条命令：清除所有生命。',deck:['strike','strike','arc','arc','regroup','armor','patch','deflect']},
 acolyte:{name:'黑暗机械教士',title:'下层铸造所 · 敌方精英',level:2,hp:15,energy:2,art:'techEnemy',xp:2,credits:9,description:'被污染的能源管线向他的义体输送着不祥的脉冲。',deck:['arc','arc','strike','regroup','overload','servitor','patch','deflect','guard','stasis']},
 boss:{name:'裂隙守望者',title:'灰烬圣堂 · 远征目标',level:3,hp:24,energy:2,art:'boss',xp:3,credits:15,description:'异端领主守在传讯核心前。切断他的仪式，让这座巢都重回寂静。',deck:['strike','strike','chainsword','bolter','regroup','regroup','hex','arc','armor','deflect','guard','strike']}
};
const events={
 medbay:{name:'医疗补给站',subtitle:'恢复 / 储备',art:'med',description:'应急灯仍在闪烁。密封的医疗柜内，有足够完成一次救护的物资。',choices:[{id:'heal',label:'接受救护',detail:'恢复 8 点生命 · 免费'},{id:'kit',label:'带走医疗包',detail:'占用 1 个背包位 · 使用恢复 6 点生命'},{id:'leave',label:'继续前进',detail:'不领取补给'}]},
 armory:{name:'封存军械库',subtitle:'获得卡牌',art:'bolter',description:'封条完整，军械尚可使用。选择一项军备，加入本次远征的牌组。'},
 purge:{name:'战术重整室',subtitle:'精简牌组',art:'eagle',description:'清理冗余战术。支付 5 军需，永久移除本次远征牌组中的一张牌。'},
 fork:{name:'巢都岔道',subtitle:'重选遭遇',art:'route',description:'前方舱道一侧回荡着枪声，另一侧只有电流的嗡鸣。可以将另外两张遭遇放回牌堆，重新侦察。',choices:[{id:'reroute',label:'改走维修通道',detail:'重洗其余未处理遭遇，重新揭示两张'},{id:'leave',label:'沿原路线推进',detail:'保留当前另外两张遭遇'}]},
 shrine:{name:'遗落的圣匣',subtitle:'风险 / 收获',art:'chalice',description:'圣匣嵌在带电的祭坛中。取走它需要承受一次短暂电击。',choices:[{id:'relic',label:'回收圣匣',detail:'失去 3 点生命，获得「殉道者圣像」与 5 军需'},{id:'leave',label:'封存此地',detail:'安全离开'}]},
 merchant:{name:'前线军需站',subtitle:'军需交换',art:'crate',description:'军需官确认了你的识别码。库存有限，但足够支撑最后一段突入。'}
};
const adventure=['cultist','medbay','armory','rebel','purge','fork','husk','medbay','merchant','acolyte','shrine','medbay'];
const api={RULES,cards,classes,enemies,events,adventure};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GAME_DATA=api;
})(typeof globalThis!=='undefined'?globalThis:this);
