const assert=require('node:assert/strict');
const {run,localDate,CATALOGUE}=require('../src/transform.js');
const base='https://example.org/unseen';
function input(iso,zone='Europe/Zurich',extra={}){return {trmnl:{system:{timestamp_utc:iso},user:{time_zone_iana:zone},plugin_settings:{custom_fields_values:{assets_base_url:base,...extra}}}};}
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS',name);}
check('same local day survives UTC midnight and repeated refreshes',()=>assert.equal(run(input('2026-10-16T22:01:00Z')).selected_entry.id,run(input('2026-10-17T21:59:00Z')).selected_entry.id));
check('changes at local midnight',()=>assert.notEqual(run(input('2026-10-17T21:59:59Z')).selected_entry.id,run(input('2026-10-17T22:00:00Z')).selected_entry.id));
check('every plate appears once before the collection repeats',()=>{const size=CATALOGUE.length;const ids=Array.from({length:size+1},(_,n)=>run(input(new Date(Date.UTC(2026,9,17+n,12)).toISOString())).selected_entry.id);assert.equal(new Set(ids.slice(0,size)).size,size);assert.equal(ids[0],ids[size]);});
check('Zurich autumn DST repeated hour is the same day',()=>assert.equal(run(input('2026-10-25T00:30:00Z')).selected_entry.id,run(input('2026-10-25T01:30:00Z')).selected_entry.id));
check('Zurich spring DST day',()=>assert.equal(localDate(new Date('2027-03-28T22:30:00Z'),{time_zone_iana:'Europe/Zurich'}),'2027-03-29'));
check('UTC negative offset date',()=>assert.equal(localDate(new Date('2026-10-17T03:00:00Z'),{time_zone_iana:'America/New_York'}),'2026-10-16'));
check('UTC positive offset date',()=>assert.equal(localDate(new Date('2026-10-17T12:00:00Z'),{time_zone_iana:'Pacific/Auckland'}),'2026-10-18'));
check('legacy zone falls back to supplied offset',()=>assert.equal(localDate(new Date('2026-10-17T23:00:00Z'),{time_zone:'Bern',utc_offset:7200}),'2026-10-18'));
check('UTC fallback and leap day',()=>assert.equal(localDate(new Date('2028-02-29T12:00:00Z')),'2028-02-29'));
check('dates before epoch select a valid subject',()=>assert.ok(run(input('2025-01-01T12:00:00Z')).selected_entry.id));
check('Unix seconds and milliseconds agree',()=>assert.equal(run(input(1792238400)).date,run(input(1792238400000)).date));
check('invalid timestamp is rejected',()=>assert.throws(()=>run(input('not-a-date'))));
check('caption off preserves attribution in output',()=>{const r=run(input('2026-10-17T12:00:00Z','UTC',{show_caption:'no'}));assert.equal(r.show_caption,false);assert.ok(r.selected_entry.credit);assert.ok(r.selected_entry.license_url);});
check('missing or unsafe public URL enters setup state',()=>{for(const value of ['','javascript:alert(1)','http://example.org'])assert.equal(run(input('2026-10-17T12:00:00Z','UTC',{assets_base_url:value})).setup_required,true);});
check('repository image source is the default when no custom field is supplied',()=>{const r=run({trmnl:{system:{timestamp_utc:'2026-10-17T12:00:00Z'},user:{time_zone_iana:'UTC'}}});assert.equal(r.setup_required,false);assert.equal(r.selected_entry.image_url,'https://raw.githubusercontent.com/michaelkurath/TRMNL-Unseen/main/assets/plates/butterfly-wing.png');});
check('all emitted payloads remain below 5 KB',()=>{for(let n=0;n<CATALOGUE.length;n++){const r=run(input(new Date(Date.UTC(2026,9,17+n,12)).toISOString()));assert.ok(Buffer.byteLength(JSON.stringify(r))<5000);assert.equal(r.selected_entry.image_url,base+'/'+r.selected_entry.local_image);}});
function refreshInput(mode,state={}){const request=input('2026-10-18T08:00:00Z','Europe/Zurich',{picture_mode:mode});request.trmnl.state=state;return request;}
check('every refresh advances at the same timestamp through all plates before repeating',()=>{
 let state={},ids=[];
 for(let n=0;n<=CATALOGUE.length;n++){
  const result=run(refreshInput('every_refresh',state));state=result.trmnl_state;ids.push(result.selected_entry.id);
  assert.equal(result.picture_mode,'every_refresh');
 }
 assert.equal(new Set(ids.slice(0,-1)).size,CATALOGUE.length);assert.equal(ids[0],ids.at(-1));
});
check('fresh refresh-mode install starts with the daily plate',()=>assert.equal(run(refreshInput('every_refresh')).selected_entry.id,run(refreshInput('daily')).selected_entry.id));
check('missing or stale saved cursor recovers to a valid plate',()=>{
 for(const state of [undefined,null,{},[],{unseen_last_plate_id:'removed-plate'},{unseen_last_plate_id:42}]){
  const result=run(refreshInput('every_refresh',state));assert.ok(CATALOGUE.some(e=>e.id===result.selected_entry.id));assert.equal(result.trmnl_state.unseen_last_plate_id,result.selected_entry.id);
 }
});
check('daily mode ignores the refresh cursor and stays on the calendar plate',()=>{
 const expected=run(refreshInput('daily')).selected_entry.id;
 for(const entry of CATALOGUE)assert.equal(run(refreshInput('daily',{unseen_last_plate_id:entry.id})).selected_entry.id,expected);
});
check('switching modes advances from the last daily plate and restores the daily plate',()=>{
 const daily=run(refreshInput('daily'));const next=run(refreshInput('every_refresh',daily.trmnl_state));
 assert.notEqual(next.selected_entry.id,daily.selected_entry.id);
 assert.equal(run(refreshInput('daily',next.trmnl_state)).selected_entry.id,daily.selected_entry.id);
});
check('Force Refresh can advance with empty previous merge variables',()=>{
 const first=run(refreshInput('every_refresh'));const request=refreshInput('every_refresh',first.trmnl_state);request.trmnl.previous_merge_variables={};
 assert.notEqual(run(request).selected_entry.id,first.selected_entry.id);
});
check('invalid image host does not write or consume the saved cursor',()=>{
 const request=refreshInput('every_refresh',{unseen_last_plate_id:CATALOGUE[0].id});request.trmnl.plugin_settings.custom_fields_values.assets_base_url='';
 const result=run(request);assert.equal(result.setup_required,true);assert.equal(Object.hasOwn(result,'trmnl_state'),false);
});
check('unknown picture mode falls back to daily',()=>assert.equal(run(refreshInput('invalid')).picture_mode,'daily'));
check('refresh-mode payloads stay below 5 KB with a small saved cursor',()=>{
 for(const entry of CATALOGUE){const result=run(refreshInput('every_refresh',{unseen_last_plate_id:entry.id}));assert.ok(Buffer.byteLength(JSON.stringify(result))<5000);assert.ok(Buffer.byteLength(JSON.stringify(result.trmnl_state))<100);}
});
console.log(`${checks} rotation and payload checks passed.`);
