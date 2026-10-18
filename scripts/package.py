"""Verify delivered image palettes and package the review prototype."""
import json,zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'previews/layout-report.json').read_text())
assert len(rows)==55 and not any(r['clipped'] for r in rows)
for r in rows:
 p=ROOT/f"previews/{r['filename']}.png"
 with Image.open(p) as im:
  im.load()
  expected=(round(r['width']*r['dpr']),round(r['height']*r['dpr']))
  assert im.size==expected,(p.name,im.size,expected)
  vals=im.convert('L').getextrema()
  colors=im.convert('L').getcolors(257)
  assert colors is not None and len(colors)<=2**r['bits'],(p.name,len(colors))
for e in json.loads((ROOT/'data/catalogue.json').read_text())['entries']:
 Image.open(ROOT/e['local_image']).verify()
status={'version':'0.1.0','image_integrity_checks':10,'rotation_and_payload_tests':15,'layout_renders':55,'clipped_layouts':0,'palette_and_geometry_checks':55,'trmnlp_executed':False,'authenticated_trmnl_render_executed':False,'physical_device_tested':False,'installed':False,'collection_size':10,'repeat_period_days':10,'preview_processing':'Local browser rendering; Pillow Floyd-Steinberg photos for OG and 16-level grayscale quantization for X.'}
(ROOT/'data/validation.json').write_text(json.dumps(status,indent=2)+'\n')
dest=ROOT.parent/'UNSEEN-v0.1.0.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(ROOT.rglob('*')):
  if not p.is_file() or 'assets/source' in p.as_posix() or p.name.endswith('-raw.png') or '__pycache__' in p.parts:continue
  if p.parent.name=='previews' and p.suffix=='.html' and p.name!='index.html':continue
  if p.parent.name=='previews' and p.suffix=='.png':
   if '-setup' in p.name or '-image-only' in p.name:continue
   if p.name.startswith('x-portrait-') and p.name!='x-portrait-full-butterfly-wing.png':continue
  z.write(p,Path('UNSEEN')/p.relative_to(ROOT))
with zipfile.ZipFile(dest) as z:assert z.testzip() is None
print(json.dumps({'file':str(dest),'size_bytes':dest.stat().st_size,'validation':status},indent=2))
