"""Re-fetch the committed, individually credited source collection when needed."""
import hashlib, json, time, urllib.request
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
HEADERS = {'User-Agent':'UNSEEN/0.2 (https://github.com/michaelkurath/TRMNL-Unseen; educational microscopy collection)'}
def main():
 catalogue=json.loads((ROOT/'data/catalogue.json').read_text())
 manifest={}
 source=ROOT/'assets/source';source.mkdir(exist_ok=True)
 for entry in catalogue['entries']:
  target=ROOT/entry['local_image']
  if target.exists():
   with Image.open(target) as image:image.verify()
   manifest[entry['local_image']]=hashlib.sha256(target.read_bytes()).hexdigest()
   continue
  # Hash the exact original before making a derivative. Changed sources require review.
  raw=source/(entry['id']+'.original')
  if not raw.exists():
   for attempt in range(4):
    try:
     with urllib.request.urlopen(urllib.request.Request(entry['original_url'],headers=HEADERS),timeout=60) as r:data=r.read()
     raw.write_bytes(data);break
    except Exception:
     if attempt==3:raise
     time.sleep(5*(attempt+1))
  assert hashlib.sha256(raw.read_bytes()).hexdigest()==entry['source_sha256'],entry['id']+' source changed'
  with Image.open(raw) as original:
   assert getattr(original,'n_frames',1)==1
   image=original.convert('L')
   image.thumbnail((entry['width'],entry['height']),Image.Resampling.LANCZOS)
   image.save(target,compress_level=6)
  manifest[entry['local_image']]=hashlib.sha256(target.read_bytes()).hexdigest()
  print('Saved',entry['id'],flush=True)
 (ROOT/'data/image-integrity.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print('Collection complete. Source metadata is snapshotted in data/commons-metadata.json.')
if __name__=='__main__':main()
