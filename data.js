(function(root){
'use strict';
const RULES={version:2,initialHand:3,drawPerTurn:2,handLimit:10,equipmentSlots:2,backpackSlots:1,initialCredits:25,removeCost:5,healAmount:8,initialEnergy:1,levelHp:2,levelXpStart:2,levelXpStep:1,energyPerLevels:3,maxBaseEnergy:3,firstTurnDraw:0,shuffleDiscard:true};
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
 marine:{name:'星际战士',subtitle:'阿斯塔特 · 战术兄弟',latin:'ADEPTUS ASTARTES',color:'#9dafa8',resource:'战术能源',hp:26,art:'marine',quote:'以钢铁为誓，以职责为盾。',description:'爆弹与链锯剑开路，动力甲承受反击。稳定的武装，可靠的火力。',tags:['物理火力','动力装甲'],deck:['strike','strike','strike','bolter','bolter','regroup','regroup','deflect','armor','med'],rewards:['chainsword','sight','armor','crossfire','lastStand','markBurst','finisher']},
 sister:{name:'战斗修女',subtitle:'战斗修女会 · 净化者',latin:'ADEPTA SORORITAS',color:'#bc7267',resource:'战术能源',hp:24,art:'sister',quote:'让信仰照亮最后的黑夜。',description:'以烈焰清除异端，以祷言维持战线。圣像与恢复带来持久作战能力。',tags:['净化烈焰','信仰恢复'],deck:['strike','strike','strike','flame','flame','flame','regroup','prayer','icon','deflect'],rewards:['inferno','icon','med','purgeFlame','warCry','requisitionKit']},
 tech:{name:'技术神甫',subtitle:'机械修会 · 探索贤者',latin:'ADEPTUS MECHANICUS',color:'#b6a070',resource:'反应堆能源',hp:23,art:'tech',quote:'血肉易逝，知识永存。',description:'调度能源，唤醒机魂。用机械支援与等离子火力构建高效循环。',tags:['能源调度','机械协同'],deck:['strike','strike','arc','arc','regroup','scan','deflect','servitor','patch','overload'],rewards:['stasis','scan','servitor','fieldRepair','heatSink','crossfire']}
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

// V2: each archetype has an active skill and its own combat loop.
Object.assign(cards,{
 designate:{name:'战术标记',cost:0,type:'skill',attr:'战术',mark:2,art:'scope',text:'施加 2 层标记。每次直接命中消耗 1 层，伤害 +2。'},
 burst:{name:'爆弹连射',cost:1,type:'attack',attr:'物理',damage:2,hits:2,art:'bolter',text:'连续攻击 2 次，每次 2 伤害；每次独立消耗标记并触发应对。'},
 execute:{name:'处决协议',cost:2,type:'attack',attr:'物理',damage:5,markedBonus:4,art:'chainsword',text:'造成 5 伤害。目标有标记时额外 +4；正常触发并消耗 1 层标记。'},
 breach:{name:'破甲弹',cost:1,type:'attack',attr:'物理',damage:3,vulnerable:2,art:'bolter',text:'造成 3 伤害，施加 2 层破绽：后续每次受击消耗一层，伤害 +2。'},
 suppressive:{name:'压制射击',cost:1,type:'attack',attr:'物理',damage:2,weaken:2,art:'bolter',text:'造成 2 伤害。虚弱 2 回合：直接攻击伤害 -2，最低为 0。'},
 riposte:{name:'盾击反攻',cost:1,type:'attack',attr:'物理',damage:2,blockBonus:true,art:'shield',text:'造成 2 + 当前护盾一半（向下取整）的伤害。保留护盾。'},
 fortress:{name:'堡垒阵列',cost:1,type:'skill',attr:'战术',block:7,art:'armor',text:'获得 7 护盾，抵御下一轮进攻。'},
 oath:{name:'誓言锁敌',cost:1,type:'skill',attr:'战术',mark:3,draw:1,art:'eagle',text:'施加 3 层标记，抽 1 张牌。'},
 litany:{name:'炽诚赞歌',cost:0,type:'skill',attr:'信仰',devotion:2,art:'chalice',text:'获得 2 虔诚；修女施放信仰牌还会获得 1 虔诚。'},
 immolate:{name:'焚尽异端',cost:2,type:'attack',attr:'热能',damage:3,burn:3,art:'flame',text:'造成 3 热能伤害，施加 3 层焚烧。'},
 absolution:{name:'赦免祷告',cost:1,type:'skill',attr:'信仰',heal:3,cleanse:true,art:'chalice',text:'恢复 3 生命，清除自身焚烧、虚弱和破绽。'},
 judgment:{name:'圣火审判',cost:1,type:'attack',attr:'热能',damage:3,burningBonus:4,art:'flame',text:'造成 3 伤害。目标已焚烧时额外 +4。'},
 martyr:{name:'殉道誓约',cost:0,type:'skill',attr:'信仰',selfDamage:2,energy:2,devotion:1,art:'chalice',text:'失去 2 生命，获得 2 能源和 1 虔诚。'},
 miracle:{name:'信仰奇迹',cost:1,type:'skill',attr:'信仰',heal:2,devotionHeal:true,art:'med',text:'消耗全部虔诚，恢复 2 + 消耗量×2 的生命。'},
 incense:{name:'净化香炉',cost:1,type:'equipment',attr:'装备',passive:'censor',art:'chalice',text:'装备：己方回合结束，若敌人正在焚烧，施加 1 层破绽。'},
 recycle:{name:'战术回收',cost:1,type:'skill',attr:'机械',recycle:true,art:'gear',text:'将坟场最近的一张非回收牌拿回手牌。自身结算后进入坟场。'},
 coolant:{name:'冷却循环',cost:0,type:'skill',attr:'机械',cool:3,block:3,art:'stasis',text:'降低 3 热量，获得 3 护盾；本牌不产生热量。'},
 discharge:{name:'热能释放',cost:1,type:'attack',attr:'电能',damage:3,heatBonus:true,art:'plasma',text:'造成 3 + 当前热量的伤害，之后热量归零。'},
 drone:{name:'战斗机仆',cost:1,type:'equipment',attr:'装备',passive:'drone',art:'skull',text:'装备：己方每回合结束，对敌人进行 1 次 2 伤害物理攻击。'},
 induction:{name:'感应充能',cost:0,type:'skill',attr:'机械',energy:2,heat:1,art:'arc',text:'获得 2 能源与 1 热量；神甫机械牌被动还会增加 1 热量。'},
 emp:{name:'电磁脉冲',cost:2,type:'attack',attr:'电能',damage:3,suppress:1,strip:true,art:'arc',text:'清除目标护盾，造成 3 电能伤害，并压制 1 回合。'},
 ward:{name:'应急屏障',cost:0,type:'reaction',attr:'应对',reflect:0,reactBlock:4,art:'shield',text:'受到直接攻击时自动打出：获得 4 护盾，不反射。'},
 rend:{name:'撕裂打击',cost:1,type:'attack',attr:'物理',damage:3,vulnerable:1,art:'knife',text:'造成 3 物理伤害，施加 1 层破绽。'},
 curse:{name:'衰弱诅咒',cost:1,type:'skill',attr:'亚空间',weaken:2,burn:1,art:'chaos',text:'目标虚弱 2 回合，并获得 1 层焚烧。'}
});
cards.scan.cost=1;cards.scan.text='消耗 1 能源，抽 1 张牌并恢复 1 能源。';
Object.assign(cards,{
 crossfire:{name:'交叉火力',cost:1,type:'attack',attr:'物理',damage:2,hits:2,draw:1,art:'bolter',text:'连续攻击2次，每次2伤害；若任一击命中，抽1张。'},
 lastStand:{name:'最后防线',cost:1,type:'skill',attr:'战术',block:6,energy:1,art:'shield',text:'获得6护盾并恢复1能源，适合在反击前稳住阵线。'},
 purgeFlame:{name:'净化脉冲',cost:1,type:'attack',attr:'热能',damage:2,enemyCleanse:true,art:'flame',text:'造成2热能伤害，并清除敌人的焚烧、疫毒与虚弱。'},
 markBurst:{name:'锁定爆破',cost:1,type:'attack',attr:'物理',damage:2,markedBonus:5,art:'scope',text:'造成2伤害；目标有标记时额外+5，并消耗正常标记。'},
 fieldRepair:{name:'战场重构',cost:1,type:'skill',attr:'机械',heal:4,block:2,draw:1,art:'gear',text:'恢复4生命、获得2护盾并抽1张。'},
 martyrGuard:{name:'牺牲护盾',cost:0,type:'reaction',attr:'应对',reactBlock:6,selfDamage:1,art:'shield',text:'受到直接攻击时自动打出：获得6护盾，自身失去1生命。'},
 heatSink:{name:'散热装甲',cost:1,type:'equipment',attr:'装备',passive:'armor',art:'armor',text:'装备：物理伤害减1；技术神甫每回合结束热量额外降低1。'},
 warCry:{name:'战团战吼',cost:0,type:'skill',attr:'战术',draw:2,weaken:1,art:'eagle',text:'抽2张，令敌人虚弱1回合。'},
 finisher:{name:'斩首窗口',cost:2,type:'attack',attr:'物理',damage:8,woundedBonus:4,art:'chainsword',text:'造成8伤害；敌人生命不高于一半时额外+4。'},
 requisitionKit:{name:'军需急救包',cost:1,type:'skill',attr:'医疗',heal:6,cleanse:true,art:'med',text:'恢复6生命并清除自身所有持续负面状态。'}
});
const skills={marine:{name:'锁敌指令',cost:1,cooldown:2,art:'scope',text:'标记 +2，抽 1 张。冷却 2 回合。'},sister:{name:'圣火祈愿',cost:0,cooldown:2,art:'chalice',text:'消耗 3 虔诚：恢复 4 生命、施加 2 焚烧。冷却 2 回合。'},tech:{name:'紧急泄压',cost:0,cooldown:2,art:'gear',text:'清空热量：获得热量 +2 护盾，修复至多 3 生命，清除标记，抽 1 张。冷却 2 回合。'}};
Object.assign(classes.marine,{description:'标记目标，再以连射逐层引爆。每回合首次攻击标记目标额外 +1 伤害。',tags:['标记 · 连射','主动锁敌'],deck:['strike','strike','bolter','burst','designate','regroup','deflect','armor','detox','fortress'],rewards:['execute','breach','oath','riposte','sight','suppressive','chainsword','fortress']});
Object.assign(classes.sister,{description:'焚烧与信仰积累虔诚，释放圣火祈愿；审判能处决正在燃烧的敌人。',tags:['焚烧 · 虔诚','净化祈愿'],deck:['strike','strike','flame','flame','judgment','litany','regroup','prayer','icon','deflect'],rewards:['inferno','immolate','judgment','absolution','martyr','miracle','incense','litany']});
Object.assign(classes.tech,{description:'机械与电能牌积累热量。热能释放转化爆发，紧急泄压转化防御；失控会灼伤自身。',tags:['过热 · 回收','机仆协同'],hp:26,deck:['arc','arc','discharge','induction','coolant','drone','patch','deflect','scan','recycle'],rewards:['emp','drone','induction','discharge','recycle','overload','stasis','scan']});
const talents={marine:[{id:'precision',name:'精准歼灭',text:'消耗标记时再 +1 伤害。'},{id:'bulwark',name:'坚壁战术',text:'每场战斗开局获得 5 护盾。'}],sister:[{id:'zeal',name:'虔诚之心',text:'每场战斗开局拥有 3 虔诚。'},{id:'mercy',name:'疗愈祷文',text:'圣火祈愿额外恢复 3 生命。'}],tech:[{id:'sink',name:'强化散热',text:'热量安全上限从 4 提升至 6。'},{id:'cog',name:'机魂同步',text:'每回合第一张装备牌费用减 1。'}]};
const difficulties={story:{name:'侦察',hp:1,damage:0,text:'敌方标准生命，适合学习新机制。'},veteran:{name:'老兵',hp:1.2,damage:0,text:'敌方生命 +20%，需要构筑与技能配合。'},nightmare:{name:'炼狱',hp:1.45,damage:0,text:'敌方生命 +45%，更考验防御与持续作战。'}};
Object.assign(enemies,{
 marksman:{name:'叛军狙击手',title:'巢都高塔 · 标记猎手',level:2,hp:17,energy:2,art:'rebel',xp:2,credits:8,description:'先标记，后连射。不要让破绽暴露在他的瞄准镜中。',tactic:'每 3 回合标记你 2 层',trait:'mark',deck:['designate','burst','bolter','regroup','guard','strike','deflect','breach']},
 officer:{name:'叛军指挥官',title:'巢都关隘 · 区域首领',level:3,hp:27,energy:2,art:'boss',xp:3,credits:14,description:'以标记协调火力的叛军首领。护盾不能替代对连射的预防。',tactic:'每 3 回合标记你 2 层',trait:'mark',deck:['designate','burst','burst','execute','regroup','guard','armor','deflect','strike','bolter']},
 saboteur:{name:'熔炉破坏者',title:'熔炉管线 · 热能专家',level:3,hp:21,energy:2,art:'techEnemy',xp:2,credits:9,description:'以焚烧与圣火审判连锁攻击。净化与虚弱能争取时间。',deck:['flame','inferno','judgment','regroup','guard','ward','arc','strike']},
 forgeBoss:{name:'铁祸贤者',title:'熔炉核心 · 区域首领',level:4,hp:34,energy:3,art:'techEnemy',xp:4,credits:18,description:'机仆与电磁武器构成杀戮循环。',tactic:'每 3 回合给你施加 2 焚烧',trait:'fire',deck:['drone','arc','emp','overload','regroup','coolant','ward','patch','stasis','arc']},
 zealot:{name:'裂隙狂信徒',title:'废弃舰桥 · 混沌先锋',level:4,hp:24,energy:2,art:'cultist',xp:2,credits:9,description:'诅咒削弱你的攻击，撕裂攻击制造破绽。',deck:['curse','rend','rend','hex','regroup','deflect','guard','strike']},
 terminator:{name:'堕落终结者',title:'舰船武库 · 重装精英',level:4,hp:30,energy:3,art:'boss',xp:3,credits:12,description:'重甲、护盾与反击。电能和热能能绕过装甲。',deck:['armor','armor','fortress','chainsword','burst','regroup','deflect','med','strike','bolter']},
 oracle:{name:'裂隙先知',title:'舰船圣所 · 亚空间先知',level:4,hp:27,energy:3,art:'cultist',xp:3,credits:12,description:'焚烧、虚弱和破绽交织成一张无形的网。',tactic:'每 3 回合令你虚弱 2 回合',trait:'curse',deck:['curse','hex','hex','stasis','rend','regroup','ward','med','arc']}
});
Object.assign(enemies.cultist,{hp:13,deck:['strike','strike','flame','regroup','guard','deflect','rend']});
Object.assign(enemies.rebel,{hp:16,deck:['strike','bolter','burst','designate','regroup','guard','armor','deflect']});
Object.assign(enemies.husk,{hp:21,energy:2});Object.assign(enemies.acolyte,{hp:25});
Object.assign(enemies.boss,{hp:43,energy:3,level:5,tactic:'生命低于一半：护盾 +6、抽 2 张牌；每 3 回合施加虚弱',trait:'final',deck:['curse','hex','burst','execute','designate','regroup','regroup','ward','armor','rend','overload','emp']});
Object.assign(events,{
 forge:{name:'军械强化台',subtitle:'单卡升级',art:'gear',description:'支付 8 军需，强化牌组中的一张攻击牌：基础伤害 +1。每个卡牌实例仅强化一次。'},
 training:{name:'战术专精舱',subtitle:'永久专精',art:'eagle',description:'选择一种职业专精，持续本次远征。已经掌握的专精不会重复出现。'}
});
const chapters=[
 {name:'灰烬巢都',subtitle:'混沌登陆区 · 难度 I',color:'#477a9f',boss:'officer',bosses:['officer','skullLord','unclean'],cards:['cultist','plaguebearer','armory','khornate','purge','fork','marksman','medbay','warrior','merchant']},
 {name:'铁祸铸造所',subtitle:'死灵与兽人争夺区 · 难度 II',color:'#bd7a3e',boss:'forgeBoss',bosses:['forgeBoss','overlord','warboss'],cards:['husk','rotDrone','forge','acolyte','nob','merchant','armory','immortal','training','shrine']},
 {name:'殉道者号',subtitle:'终焉舰桥 · 难度 III',color:'#995b9c',boss:'boss',bosses:['boss','unclean','skullLord','overlord','warboss'],cards:['zealot','plagueHerald','armory','terminator','redChampion','forge','purge','oracle','merchant','shrine']}
];
// Faction expansion: separate theaters, shared combat rules, distinct card identities.
Object.assign(cards,{
 redThirst:{name:'赤渴突袭',cost:1,type:'attack',attr:'物理',damage:3,drain:2,art:'chainsword',text:'造成3伤害；实际伤害最多转化为2生命恢复。'},
 angelCharge:{name:'天使降临',cost:1,type:'attack',attr:'物理',damage:3,woundedBonus:3,art:'eagle',text:'造成3伤害；自身生命不高于一半时额外+3。'},
 bloodOath:{name:'圣血誓言',cost:0,type:'skill',attr:'战术',selfDamage:2,energy:2,art:'chalice',text:'失去2生命，获得2能源。'},
 grail:{name:'圣血圣杯',cost:1,type:'equipment',attr:'装备',passive:'faith',art:'chalice',text:'装备：每个己方回合结束恢复1生命。'},
 siege:{name:'攻城齐射',cost:1,type:'attack',attr:'物理',damage:2,blockBonus:true,art:'bolter',text:'造成2+当前护盾一半的伤害；保留护盾。'},
 bastion:{name:'不破之墙',cost:1,type:'skill',attr:'战术',block:6,draw:1,art:'shield',text:'获得6护盾，抽1张。'},
 bolterDrill:{name:'爆弹操典',cost:1,type:'attack',attr:'物理',damage:2,hits:2,art:'bolter',text:'连续射击两次，每次2伤害。'},
 forgeFlame:{name:'锻炉之息',cost:1,type:'attack',attr:'热能',damage:2,burn:2,art:'flame',text:'造成2热能伤害，施加2焚烧。'},
 promethean:{name:'普罗米修斯之誓',cost:0,type:'skill',attr:'战术',block:3,cleanse:true,art:'shield',text:'获得3护盾，清除焚烧、虚弱和破绽。'},
 melta:{name:'熔毁射线',cost:2,type:'attack',attr:'热能',damage:5,strip:true,art:'plasma',text:'先清除目标护盾，再造成5热能伤害。'},
 hunt:{name:'狼群猎杀',cost:0,type:'skill',attr:'战术',vulnerable:2,art:'scope',text:'施加2破绽，后续每次直接命中消耗1层并+2伤害。'},
 frostAxe:{name:'霜牙战斧',cost:1,type:'attack',attr:'物理',damage:4,exposedBonus:2,art:'chainsword',text:'造成4伤害；目标存在破绽时额外+2。'},
 counterHunt:{name:'猎手反击',cost:0,type:'reaction',attr:'应对',reflect:3,art:'shield',text:'受直接攻击时自动打出，反射最多3伤害。每次受击限一张。'},
 rotBlade:{name:'瘟疫之刃',cost:1,type:'attack',attr:'物理',damage:2,poison:2,art:'knife',text:'造成2物理伤害，施加2疫毒。疫毒回合开始扣层数生命，然后减1。'},
 miasma:{name:'瘴气吐息',cost:1,type:'skill',attr:'亚空间',poison:2,weaken:1,art:'chaos',text:'施加2疫毒、1回合虚弱。'},
 rottenFlesh:{name:'腐朽躯壳',cost:1,type:'skill',attr:'亚空间',heal:3,block:3,art:'armor',text:'恢复3生命，获得3护盾。'},
 plagueBell:{name:'疫病丧钟',cost:2,type:'attack',attr:'亚空间',damage:3,poison:3,art:'chaos',text:'造成3亚空间伤害，施加3疫毒。'},
 chainAxe:{name:'链锯斧猛劈',cost:1,type:'attack',attr:'物理',damage:5,selfDamage:1,art:'chainsword',text:'造成5伤害，自身失去1生命。'},
 bloodFrenzy:{name:'血祭狂怒',cost:0,type:'skill',attr:'战术',selfDamage:2,energy:2,art:'chaos',text:'失去2生命，获得2能源；这是狂暴战术而非灵能。'},
 skullClaim:{name:'颅骨收割',cost:2,type:'attack',attr:'物理',damage:4,woundedBonus:4,art:'chainsword',text:'造成4伤害；自身生命不高于一半时额外+4。'},
 brassGuard:{name:'黄铜护甲',cost:1,type:'skill',attr:'战术',block:5,art:'armor',text:'获得5护盾。'},
 gauss:{name:'高斯剥离',cost:1,type:'attack',attr:'电能',damage:3,strip:true,art:'arc',text:'清除目标护盾，造成3电能伤害。'},
 reanimate:{name:'复苏协议',cost:1,type:'skill',attr:'机械',heal:4,recycle:true,art:'gear',text:'恢复4生命，回收最近一张非回收牌。'},
 livingMetal:{name:'活体金属',cost:1,type:'equipment',attr:'装备',passive:'faith',art:'armor',text:'装备：己方回合结束修复1生命。'},
 chronostasis:{name:'时滞矩阵',cost:1,type:'skill',attr:'机械',suppress:2,block:3,art:'stasis',text:'压制目标2回合，获得3护盾。'},
 tesla:{name:'特斯拉电弧',cost:2,type:'attack',attr:'电能',damage:2,hits:3,art:'arc',text:'连续攻击3次，每次2电能伤害。'},
 choppa:{name:'砍砍斧',cost:0,type:'attack',attr:'物理',damage:2,art:'chainsword',text:'造成2物理伤害。'},
 dakka:{name:'哒哒哒！',cost:1,type:'attack',attr:'物理',damage:1,hits:3,art:'bolter',text:'连续射击3次，每次1伤害；每次独立结算应对。'},
 waaagh:{name:'WAAAGH！冲锋',cost:0,type:'skill',attr:'战术',energy:2,vulnerable:1,art:'eagle',text:'获得2能源，施加1破绽。'},
 scrapPlate:{name:'废铁装甲',cost:1,type:'equipment',attr:'装备',passive:'armor',art:'armor',text:'装备：每次受到物理伤害减少1。'},
 bigChoppa:{name:'大砍砍',cost:2,type:'attack',attr:'物理',damage:7,art:'chainsword',text:'造成7物理伤害。'},
 detox:{name:'战地解毒',cost:0,type:'skill',attr:'医疗',heal:3,cleanse:true,art:'med',text:'恢复3生命，清除疫毒、焚烧、虚弱与破绽。'}
});
for(const id of ['absolution','promethean'])cards[id].text=cards[id].text.replace('焚烧、虚弱','疫毒、焚烧、虚弱');
Object.assign(classes.marine,{name:'极限战士',subtitle:'第十三军团传承 · 战术纪律',latin:'ULTRAMARINES',art:'ultramarine',color:'#548fd1',passiveText:'每回合首次命中标记目标额外+1伤害'});
function chapterClass(id,name,latin,color,hp,description,tags,deck,rewards,passiveText){classes[id]={name,subtitle:'阿斯塔特战团 · '+tags[0],latin,color,hp,description,tags,deck,rewards,passiveText,resource:'战术能源',art:id,quote:'为了帝皇与战团。'};}
chapterClass('blood','血天使','BLOOD ANGELS','#cd565c',28,'以赤渴吸收伤害转为恢复；半血时降临攻击更强，但自伤需要控制。',['赤渴 · 近战','受伤爆发'],['strike','redThirst','redThirst','angelCharge','bloodOath','guard','grail','deflect','med','regroup'],['redThirst','angelCharge','grail','bloodOath','chainsword','crossfire','finisher','detox'],'每回合首次物理攻击造成实际伤害后恢复1生命');
chapterClass('fists','帝国之拳','IMPERIAL FISTS','#d9b84e',28,'先筑垒再盾击。每回合重建防线，以护盾支撑攻城火力。',['筑垒 · 护盾','攻城火力'],['strike','strike','siege','bolterDrill','bastion','guard','armor','regroup','ward','med'],['siege','bastion','riposte','fortress','armor','bolterDrill','lastStand','detox'],'开局及每回合开始获得2护盾');
chapterClass('salamander','火蜥蜴','SALAMANDERS','#62aa70',28,'锻炉之焰与熔毁射线清除重甲；护民誓言净化异常并维持防线。',['焚烧 · 熔毁','坚韧净化'],['strike','forgeFlame','flame','judgment','promethean','regroup','armor','med','ward','forgeFlame'],['forgeFlame','melta','judgment','promethean','inferno','armor','purgeFlame','detox'],'每回合第一张热能牌额外施加1焚烧');
chapterClass('wolf','太空野狼','SPACE WOLVES','#89b5cc',27,'制造破绽，以霜牙战斧追击；保留反击牌，让敌人付出代价。',['猎杀 · 破绽','反击追击'],['strike','frostAxe','frostAxe','hunt','counterHunt','guard','med','regroup','bolter','hunt'],['frostAxe','hunt','counterHunt','rend','breach','chainsword','warCry','detox'],'每回合首次攻击破绽目标额外+1伤害');
Object.assign(skills,{
 blood:{name:'赤色降临',cost:1,cooldown:2,art:'chainsword',damage:3,drain:3,text:'造成3物理伤害，按实际伤害恢复至多3生命。冷却2回合。'},
 fists:{name:'坚守阵地',cost:0,cooldown:2,art:'shield',block:6,text:'获得6护盾。冷却2回合。'},
 salamander:{name:'锻炉守护',cost:1,cooldown:2,art:'flame',block:4,burn:2,cleanse:true,text:'获得4护盾，清除疫毒/焚烧/虚弱/破绽，敌人焚烧+2。冷却2回合。'},
 wolf:{name:'猎群号令',cost:1,cooldown:2,art:'scope',vulnerable:2,draw:1,text:'施加2破绽，抽1张。冷却2回合。'}
});
Object.assign(talents,{
 blood:[{id:'chalice',name:'圣杯守护',text:'赤渴被动每次额外恢复1生命。'},{id:'descent',name:'天使之怒',text:'赤色降临基础伤害+2。'}],
 fists:[{id:'wall',name:'磐石防线',text:'每回合及开场的被动护盾从2变为4。'},{id:'siegecraft',name:'攻城大师',text:'自身护盾至少5时，物理攻击+1伤害。'}],
 salamander:[{id:'forgeheart',name:'锻炉之心',text:'首张热能牌额外焚烧从1变为2。'},{id:'protector',name:'护民者',text:'锻炉守护额外恢复3生命。'}],
 wolf:[{id:'pack',name:'狼群之牙',text:'首次攻击破绽目标的额外伤害从1变为2。'},{id:'hunter',name:'狩猎本能',text:'猎群号令额外获得3护盾。'}]
});
const factions={imperialRebels:{name:'叛军与混沌',color:'#ad8498',tactic:'混合火力、标记与亚空间压制'},nurgle:{name:'纳垢恶魔',color:'#97b95c',tactic:'疫毒消耗与腐朽恢复；解毒、净化与爆发克制'},khorne:{name:'恐虐战帮',color:'#ed766b',tactic:'自伤换能源、近战爆发；虚弱与应对克制'},necron:{name:'太空死灵',color:'#5ee4bc',tactic:'高斯破盾、活体金属与复苏；集中火力克制'},ork:{name:'兽人战帮',color:'#b9cc56',tactic:'多段扫射、冲锋与废铁重甲；物理减伤与热能克制'}};
for(const e of Object.values(enemies))e.faction='imperialRebels';
function foe(id,faction,name,hp,energy,level,deck,description){const factionArt={nurgle:'cultist',khorne:'boss',necron:'servitorEnemy',ork:'rebel'};enemies[id]={name,faction,art:factionArt[faction],title:factions[faction].name+' · '+(level>=5?'战区首领':level>=3?'精英':'先锋'),hp,energy,level,deck,description,art:faction,xp:level>=5?4:level>=3?2:1,credits:level>=5?18:level>=3?9:6};}
foe('plaguebearer','nurgle','疫病行者',15,1,1,['strike','rotBlade','miasma','rottenFlesh','guard','regroup','strike'],'纳垢花园的低阶恶魔。疫毒绕过护盾；净化可以清除。');
foe('rotDrone','nurgle','腐疫虫群',22,2,3,['rotBlade','rotBlade','miasma','rottenFlesh','ward','regroup','strike','plagueBell'],'成群的腐疫生物以反复染毒拖垮目标。');
foe('plagueHerald','nurgle','疫病先驱',28,2,4,['plagueBell','miasma','rottenFlesh','rottenFlesh','rotBlade','regroup','ward','strike'],'丧钟把疫毒层层叠加。必须决定何时花牌净化。');
foe('unclean','nurgle','大不净者·腐钟',42,3,5,['plagueBell','plagueBell','miasma','rottenFlesh','rottenFlesh','rotBlade','regroup','ward','strike','guard'],'腐钟守在疫病裂隙前。击败它才能关闭纳垢花园的入口。');
foe('khornate','khorne','恐虐腐化阿斯塔特',17,1,1,['chainAxe','strike','bloodFrenzy','brassGuard','strike','deflect','regroup'],'抛弃战术纪律的堕落战士，以伤口换取下一次冲锋。');
foe('berserker','khorne','吞世者狂战士',24,2,3,['chainAxe','chainAxe','bloodFrenzy','skullClaim','deflect','brassGuard','strike','regroup'],'半血后颅骨收割更危险。虚弱与反射能遏制其爆发。');
foe('redChampion','khorne','黄铜冠军',30,2,4,['chainAxe','skullClaim','bloodFrenzy','brassGuard','armor','deflect','strike','regroup'],'黄铜护甲保护着冲锋者，近战仍是它唯一的语言。');
foe('skullLord','khorne','颅骨领主',41,3,5,['chainAxe','chainAxe','skullClaim','bloodFrenzy','brassGuard','armor','deflect','regroup','strike'],'鲜血祭坛的主人。没有灵能，只有链锯、怒吼和血祭。');
foe('warrior','necron','死灵武士',16,1,1,['gauss','strike','reanimate','guard','regroup','strike','ward'],'高斯束先剥去护盾。复苏需要真实卡牌与能源，并非无限复活。');
foe('immortal','necron','死灵永生者',23,2,3,['gauss','gauss','tesla','livingMetal','regroup','ward','strike','reanimate'],'以活体金属维持机体，以特斯拉电弧压垮应对。');
foe('cryptek','necron','时空术士',28,2,4,['chronostasis','gauss','reanimate','tesla','livingMetal','regroup','ward','strike'],'通过时滞矩阵压制抽牌。提前留牌比临时寻找答案可靠。');
foe('overlord','necron','墓穴霸主',40,3,5,['gauss','gauss','tesla','reanimate','livingMetal','chronostasis','ward','regroup','strike'],'墓穴中枢的统治者。切断它的复苏循环，封闭唤醒信标。');
foe('boy','ork','兽人小子',17,1,1,['choppa','choppa','dakka','waaagh','guard','scrapPlate','strike'],'更多子弹，更多砍砍。减伤可以抵消它的低伤连射。');
foe('nob','ork','兽人老大',25,2,3,['bigChoppa','choppa','dakka','waaagh','scrapPlate','guard','choppa','regroup'],'粗重武器带来凶猛单击，别把所有护盾花在杂兵的扫射上。');
foe('mek','ork','大技霸',29,2,4,['dakka','dakka','scrapPlate','patch','waaagh','bigChoppa','guard','choppa'],'把废铁与枪管焊成移动堡垒。热能能绕过物理装甲。');
foe('warboss','ork','碎颅战争头目',43,3,5,['bigChoppa','bigChoppa','dakka','waaagh','scrapPlate','guard','choppa','choppa','regroup'],'绿潮聚集在它的咆哮之下。斩首头目，终止战争引擎。');
const campaigns={crusade:{name:'黑暗远征',faction:'imperialRebels',brief:'巢都—铸造所—污染舰船，回收传讯核心并终止裂隙仪式。',ending:'传讯核心重新亮起，裂隙仪式已经终止。',chapters}};
function theater(id,name,brief,ending,locations,foes){campaigns[id]={name,faction:id,brief,ending,chapters:locations.map((name,i)=>({name,subtitle:['建立滩头，夺取情报','突破精英防线','摧毁战区核心'][i],color:factions[id].color,boss:foes[i+1],cards:[foes[i===0?0:1],'medbay','armory',i===0?'purge':'forge',foes[i===0?0:2],'medbay','training','merchant','fork','medbay']}))};}
theater('nurgle','腐钟疫区','隔离受疫巢城，深入纳垢花园裂口；备好净化与解毒。','腐钟停止鸣响。疫区封锁完成，花园裂隙闭合。',['孢雾外围','腐烂庭院','七重腐钟'],['plaguebearer','rotDrone','plagueHerald','unclean']);
theater('khorne','赤色屠场','突入恐虐战帮要塞，打断颅骨献祭；防备自伤后的爆发。','颅骨祭坛崩塌，战帮冲锋在炮火中瓦解。',['血迹登陆场','黄铜堡垒','颅骨祭坛'],['khornate','berserker','redChampion','skullLord']);
theater('necron','沉眠墓穴','调查死灵王朝复苏信号，关闭中枢；护盾无法独自抵挡高斯。','墓穴唤醒信标熄灭，金属军团再次沉入静默。',['静默沙海','时滞回廊','王朝中枢'],['warrior','immortal','cryptek','overlord']);
theater('ork','碎颅绿潮','穿越兽人废铁营地，斩首战争头目；应对连射与重斧。','战争头目倒下，失控的战争引擎在远方爆炸。',['废铁荒原','大技霸工场','战争巨兽'],['boy','nob','mek','warboss']);
// Narrative alternatives for facilities do not change their established actions.
const facilityNames={nurgle:{medbay:'隔离医疗舱',armory:'密封净化武库',fork:'孢雾岔道'},khorne:{medbay:'战地救护掩体',armory:'失守军械堡',fork:'壕沟岔道'},necron:{medbay:'登陆医疗站',armory:'探险军械箱',fork:'墓穴交叉回廊'},ork:{medbay:'前沿救护站',armory:'缴获物资仓',fork:'废铁岔路'}};


const upgrades={};for(const [id,c] of Object.entries({...cards})){if(c.damage){upgrades[id]=id+'_plus';cards[id+'_plus']={...c,name:c.name+'＋',damage:c.damage+1,text:c.text+'【强化：基础伤害 +1】',upgraded:true};}}

const api={RULES,cards,classes,enemies,events,adventure,skills,talents,difficulties,chapters,upgrades,campaigns,factions,facilityNames};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GAME_DATA=api;
})(typeof globalThis!=='undefined'?globalThis:this);
