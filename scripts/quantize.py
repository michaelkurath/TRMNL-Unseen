"""Simulate panel palettes. These are local previews, not TRMNL cloud renders."""
import json, os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
report=json.loads((ROOT/os.environ.get('RENDER_REPORT','previews/layout-report.json')).read_text())
for row in report:
 src=Image.open(ROOT/f"previews/{row['filename']}-raw.png").convert('L')
 if row['bits']==1:
  out=src.point(lambda v:255 if v>=128 else 0).convert('1')
  if row['imageBox']:
   b=row['imageBox'];r=row['dpr'];box=tuple(round(v*r) for v in (b['x'],b['y'],b['x']+b['width'],b['y']+b['height']))
   out.paste(src.crop(box).convert('1',dither=Image.Dither.FLOYDSTEINBERG),box)
 else:out=src.point(lambda v:round(v/17)*17)
 dest=ROOT/f"previews/{row['filename']}.png";tmp=dest.with_suffix('.tmp.png')
 out.save(tmp,compress_level=3);tmp.replace(dest)
if os.environ.get('QUANTIZE_CONTACT_SHEETS')=='0':
 print(f'Quantized {len(report)} renders.');raise SystemExit(0)
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try:font=ImageFont.truetype(font_path,20);small=ImageFont.truetype(font_path,15)
except OSError:font=small=ImageFont.load_default()
entries=json.loads((ROOT/'data/catalogue.json').read_text())['entries']
def contact(ids,target,width=1440):
 col=width//2;rh=col*3//4+52
 canvas=Image.new('RGB',(width,len(ids)*rh+90),'#e9e8e4');d=ImageDraw.Draw(canvas)
 d.text((20,16),'UNSEEN / first collection',fill='#111111',font=font)
 d.text((20,49),'Local simulations: OG 800×480 / 1-bit  |  X 1872×1404 / 16 grays',fill='#444444',font=small)
 for n,ident in enumerate(ids):
  e=next(e for e in entries if e['id']==ident)
  for c,p in enumerate(['og','x']):
   im=Image.open(ROOT/f'previews/{p}-full-{ident}.png').convert('RGB');im.thumbnail((col-24,rh-55))
   x=c*col+(col-im.width)//2;y=90+n*rh+32
   d.text((c*col+15,90+n*rh+5),e['title']+' / '+('OG' if p=='og' else 'X'),fill='#111111',font=small)
   canvas.paste(im,(x,y))
 tmp=target.with_suffix('.tmp.png');canvas.save(tmp,compress_level=3);tmp.replace(target)
contact([e['id'] for e in entries[:10]],ROOT/'previews/all-ten-comparison.png')
for n in range(0,len(entries),10):
 contact([e['id'] for e in entries[n:n+10]],ROOT/f'previews/collection-{n+1:02d}-{min(n+10,len(entries)):02d}.png')
contact(['butterfly-wing','velcro','copper'],ROOT.parent/'UNSEEN-preview.png')
print(f"Quantized {len(report)} renders and created comparison sheets.")
