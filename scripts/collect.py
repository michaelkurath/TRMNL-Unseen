"""Snapshot ten museum micrographs and their machine-readable attribution."""
import concurrent.futures, hashlib, html, json, re, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS = [
 ('butterfly-wing', 'Butterfly wing', 'Butterfly wings 5000x - SEM MUSE.tif', '5,000×', 'Living structures'),
 ('velcro', 'Hook-and-loop fastener', 'Velcro - SEM MUSE.tif', '', 'Everyday materials'),
 ('micrometeorite', 'Micrometeorite', 'Micrometeorite 1000x - SEM MUSE.tif', '1,000×', 'Minerals & space'),
 ('paper', 'A sheet of paper', 'Paper sheet 500x - SEM MUSE.tif', '500×', 'Everyday materials'),
 ('pollen', 'Pollen', 'Pollen 1000x - SEM MUSE.tif', '1,000×', 'Living structures'),
 ('copper', 'Copper crystal', 'Copper crystal - SEM MUSE.tif', '', 'Minerals & space'),
 ('cork', 'Cork', 'Cork 100x - SEM MUSE.tif', '100×', 'Everyday materials'),
 ('hair', 'Human hair', 'Human hair 2000X - SEM MUSE.tif', '2,000×', 'Living structures'),
 ('fern', 'Fern sporangia', 'Fern sporangia 250x - SEM MUSE.tif', '250×', 'Living structures'),
 ('nylon', 'Nylon stockings', 'Women nylon stockings 500x - SEM MUSE.tif', '500×', 'Everyday materials'),
]
HEADERS = {'User-Agent':'UNSEEN-prototype/0.1 (museum image attribution research)'}
def get(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=35) as r: return r.read()
  except Exception:
   if attempt==2: raise
   time.sleep(3*(attempt+1))
def clean(s): return html.unescape(re.sub('<[^>]+>','',s)).strip()
def main():
 params={'action':'query','format':'json','titles':'|'.join('File:'+s[2] for s in SUBJECTS),'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1920}
 cache=ROOT/'data/commons-metadata.json'
 raw=json.loads(cache.read_text()) if cache.exists() else json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
 (ROOT/'data/commons-metadata.json').write_text(json.dumps(raw,indent=2))
 pages={p['title']:p for p in raw['query']['pages'].values()}
 def save(s):
  ident,title,file,mag,theme=s
  info=pages['File:'+file]['imageinfo'][0]
  meta=info['extmetadata']
  license=meta['LicenseShortName']['value']
  if license not in ['CC BY-SA 3.0','CC BY 4.0','CC BY-SA 4.0','CC0']: raise ValueError(license)
  raw_path=ROOT/f'assets/source/{ident}.tif'
  if not raw_path.exists(): raw_path.write_bytes(get(info['url']))
  im=Image.open(raw_path).convert('L')
  # Preserve the complete field of view, including the scientific scale bar.
  im.save(ROOT/f'assets/plates/{ident}.png',optimize=True)
  row={'id':ident,'title':title,'theme':theme,'magnification':mag,'method':'Scanning electron microscopy','creator':clean(meta['Artist']['value']).split('\n')[0], 'credit':'Nicola Angeli / MUSE','license':license,'license_url':meta['LicenseUrl']['value'],'source_page':info['descriptionurl'],'original_url':info['url'],'image_url':info['thumburl'],'local_image':f'assets/plates/{ident}.png','width':im.width,'height':im.height,'source_sha256':hashlib.sha256(raw_path.read_bytes()).hexdigest(),'changes':'Converted to grayscale PNG; full field of view preserved. Device previews resize and dither to their display palette.','source_description':clean(meta.get('ImageDescription',{}).get('value',''))}
  print(ident, im.size,license,flush=True)
  return row
 with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool: entries=list(pool.map(save,SUBJECTS))
 (ROOT/'data/catalogue.json').write_text(json.dumps({'version':'0.1.0','entries':entries},ensure_ascii=False,indent=2))
 for remote,name in [('https://trmnl.com/css/latest/plugins.css','plugins.css'),('https://trmnl.com/js/latest/plugins.js','plugins.js')]:
  (ROOT/'vendor'/name).write_bytes(get(remote))
 print('Catalogue and framework snapshots saved.')
if __name__=='__main__': main()
