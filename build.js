'use strict';
const fs=require('node:fs'),path=require('node:path');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')+'</style>');
html=html.replace('href="assets/sigil.svg"','href="data:image/svg+xml,'+encodeURIComponent(fs.readFileSync(path.join(__dirname,'assets/sigil.svg'),'utf8'))+'"');
for(let name of ['data.js','engine.js','art.js','app.js'])html=html.replace('<script defer src="'+name+'"></script>','');
const scripts=['data.js','engine.js','art.js','app.js'].map(name=>'<script>\n'+fs.readFileSync(path.join(__dirname,name),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n');
html=html.replace('</body>',scripts+'\n</body>');
// The portable edition keeps help inside the game and has no relative file dependency.
html=html.replace('<a href="README.md" target="_blank" rel="noopener">任务手册 ↗</a>','<button class="text-button" data-action="help">任务手册 ↗</button>');
html=html.replace('<a href="legacy/index.html">旧版与旧存档 ↗</a>','');
fs.writeFileSync(path.join(__dirname,'黑暗远征.html'),html);
console.log('已生成 黑暗远征.html · '+Math.round(Buffer.byteLength(html)/1024)+' KB');
