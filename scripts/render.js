// Render the actual Shared + layout Liquid with the official framework snapshot.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
function dependency(name){try{return require(name)}catch(_){const root=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;if(root){try{return require(path.join(root,name))}catch(_){}}return require(path.resolve(__dirname,'../../_tools/node_modules',name));}}
const {Liquid}=dependency('liquidjs'),{chromium}=dependency('playwright');
const {run}=require('../src/transform.js');
const ROOT=path.resolve(__dirname,'..');
const engine=new Liquid({strictVariables:false,strictFilters:true});
const profiles=[{id:'og',classes:'screen--og screen--md screen--1bit',w:800,h:480,dpr:1,bits:1},{id:'x',classes:'screen--v2 screen--lg screen--density-2x screen--4bit',w:1040,h:780,dpr:1.8,bits:4},{id:'x-portrait',classes:'screen--v2 screen--lg screen--density-2x screen--4bit screen--portrait',w:780,h:1040,dpr:1.8,bits:4}];
const layouts=['full','half_horizontal','half_vertical','quadrant'];
async function main(){
 const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.startsWith('/fonts/'))p='/vendor'+p;const f=path.resolve(ROOT,'.'+p);if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}try{const data=fs.readFileSync(f);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.js')?'application/javascript':f.endsWith('.png')?'image/png':f.endsWith('.woff2')?'font/woff2':'application/octet-stream');res.end(data);}catch(_){res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const executable=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch({...(executable?{executablePath:executable}:{}),headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const shared=fs.readFileSync(path.join(ROOT,'src/shared.liquid'),'utf8');
 const jobs=[];
 for(const p of profiles)for(let n=0;n<10;n++)jobs.push({p,n,layout:'full',caption:'yes'});
 for(const p of profiles)for(const layout of layouts.slice(1))jobs.push({p,n:1,layout,caption:'yes'});
 for(const p of profiles.slice(0,2))for(const layout of layouts)jobs.push({p,n:0,layout,caption:'no'});
 for(const p of profiles.slice(0,2))for(const layout of layouts)jobs.push({p,n:0,layout,caption:'yes',setup:true});
 const profileFilter=process.env.RENDER_PROFILE,layoutFilter=process.env.RENDER_LAYOUT,subjectFilter=process.env.RENDER_SUBJECT;
 const subjectIds=require('../data/catalogue.json').entries.map(e=>e.id);
 const filteredJobs=jobs.filter(j=>(!profileFilter||profileFilter.split(',').includes(j.p.id))&&(!layoutFilter||j.layout===layoutFilter)&&(!subjectFilter||subjectIds[j.n]===subjectFilter));
 const report=[],contexts=new Map();
 try{
  for(const j of filteredJobs){
   const {p,n,layout,caption}=j;
   if(!contexts.has(p.id)){const context=await browser.newContext({viewport:{width:p.w,height:p.h},deviceScaleFactor:p.dpr});contexts.set(p.id,{context,page:await context.newPage()});}
   const {page}=contexts.get(p.id);
   const input={trmnl:{system:{timestamp_utc:new Date(Date.UTC(2026,9,17+n,12)).toISOString()},user:{time_zone_iana:'Europe/Zurich'},plugin_settings:{custom_fields_values:{assets_base_url:j.setup?'':origin,show_caption:caption}}}};
   const data=run(input),markup=await engine.parseAndRender(shared+fs.readFileSync(path.join(ROOT,`src/${layout}.liquid`),'utf8'),data);
   const html=`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${origin}/vendor/plugins.css"><script src="${origin}/vendor/plugins.js"></script><style>html,body{margin:0;padding:0;background:#fff}.screen{margin:0!important;border-radius:0!important}.view{border-radius:0!important}</style></head><body class="environment trmnl"><div class="screen screen--no-bleed ${p.classes}"><div class="view view--${layout}">${markup}</div></div></body></html>`;
   await page.setContent(html,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>Promise.all(Array.from(document.images).map(im=>im.decode())));
   const measurement=await page.evaluate(()=>{
    const v=document.querySelector('.view').getBoundingClientRect();
    const elements=Array.from(document.querySelectorAll('.unseen__caption,.unseen__credit,.unseen__subject,.unseen__rights,.unseen__setup'));
    const clipped=elements.filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<v.left-1||r.right>v.right+1||r.top<v.top-1||r.bottom>v.bottom+1||el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1)}).map(el=>el.className);
    const box=document.querySelector('.unseen__image')?.getBoundingClientRect();
    return {width:v.width,height:v.height,clipped,imageBox:box?{x:box.x-v.x,y:box.y-v.y,width:box.width,height:box.height}:null,font:document.fonts.status};
   });
   const filename=`${p.id}-${layout}-${j.setup?'setup':data.selected_entry.id}${caption==='no'?'-image-only':''}`;
   await page.locator('.view').screenshot({path:path.join(ROOT,'previews',filename+'-raw.png')});
   fs.writeFileSync(path.join(ROOT,'previews',filename+'.html'),html.replaceAll(origin,'..'));
   report.push({filename,profile:p.id,bits:p.bits,dpr:p.dpr,layout,subject:data.selected_entry.id,caption,setup:!!j.setup,...measurement});
  }
 }finally{await browser.close();server.close();}
 const reportPath=path.join(ROOT,'previews/layout-report.json');
 let combined=report;
 if((profileFilter||layoutFilter||subjectFilter)&&fs.existsSync(reportPath)){
  const replaced=new Set(report.map(r=>r.filename));
  combined=[...JSON.parse(fs.readFileSync(reportPath,'utf8')).filter(r=>!replaced.has(r.filename)),...report];
 }
 fs.writeFileSync(reportPath,JSON.stringify(combined,null,2));
 const failed=report.filter(x=>x.clipped.length);
 console.log(`${report.length} renders; ${failed.length} clipped layouts.`);
 for(const x of failed)console.log(x.filename,x.clipped);
 if(failed.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exit(1)});
