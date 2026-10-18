"""Verify the committed catalogue, PNGs and generated transform without downloads."""
import hashlib, json, subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
catalogue = json.loads((ROOT / 'data/catalogue.json').read_text())['entries']
manifest = json.loads((ROOT / 'data/image-integrity.json').read_text())
assert len(catalogue) == 10 and len({e['id'] for e in catalogue}) == 10
assert set(manifest) == {e['local_image'] for e in catalogue}
for entry in catalogue:
    path = ROOT / entry['local_image']
    with Image.open(path) as image:
        image.verify()
    assert hashlib.sha256(path.read_bytes()).hexdigest() == manifest[entry['local_image']]
    assert entry['license'] == 'CC BY-SA 3.0'
    assert entry['credit'] == 'Nicola Angeli / MUSE'
    assert entry['source_page'].startswith('https://commons.wikimedia.org/')
    assert entry['source_page'] in (ROOT / 'CREDITS.md').read_text()
keys = ('id','title','theme','magnification','credit','license','license_url','source_page','local_image')
compact = [{k:e[k] for k in keys} for e in catalogue]
expected = (ROOT / 'scripts/transform.template.js').read_text().replace('__CATALOGUE__', json.dumps(compact, ensure_ascii=False, separators=(',', ':')))
assert (ROOT / 'src/transform.js').read_text() == expected, 'Run python scripts/build.py'
for layout in ('full','half_horizontal','half_vertical','quadrant'):
    assert '{{ unseen_exhibit }}' in (ROOT / f'src/{layout}.liquid').read_text()
assert 'image-dither' in (ROOT / 'src/shared.liquid').read_text()
assert len(json.loads((ROOT / 'data/ping.json').read_text())) > 0
print('PASS: 10 PNGs, image hashes, source/credit records, generated transform and four layouts.')
