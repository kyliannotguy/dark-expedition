'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const base=__dirname,port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname),file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);});}catch{res.writeHead(400);res.end('Bad request');}}).listen(port,'127.0.0.1',()=>console.log('黑暗远征已启动：http://localhost:'+port));
