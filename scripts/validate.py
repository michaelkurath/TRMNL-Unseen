"""Verify the committed catalogue, PNGs and generated transform without downloads."""
import hashlib, html, json, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
catalogue = json.loads((ROOT / 'data/catalogue.json').read_text())['entries']
manifest = json.loads((ROOT / 'data/image-integrity.json').read_text())
metadata = json.loads((ROOT / 'data/commons-metadata.json').read_text())['query']['pages']
sources = {p['imageinfo'][0]['descriptionurl']:p['imageinfo'][0] for p in metadata.values()}
assert len(catalogue) >= 60 and len({e['id'] for e in catalogue}) == len(catalogue)
assert len({e['original_url'] for e in catalogue}) == len(catalogue)
assert set(manifest) == {e['local_image'] for e in catalogue}
for entry in catalogue:
    path = ROOT / entry['local_image']
    with Image.open(path) as image:
        image.verify()
    assert hashlib.sha256(path.read_bytes()).hexdigest() == manifest[entry['local_image']]
    assert entry['license'] in ('CC BY-SA 3.0', 'CC BY-SA 4.0', 'CC BY 4.0')
    assert entry['credit'] and entry['creator'] and entry['license_url']
    assert entry['credit'] in (ROOT / 'CREDITS.md').read_text()
    assert entry['source_page'].startswith('https://commons.wikimedia.org/')
    source = sources[entry['source_page']]
    assert entry['original_url'] == source['url']
    assert entry['license'] == source['extmetadata']['LicenseShortName']['value']
    assert entry['license_url'] == source['extmetadata']['LicenseUrl']['value']
    artist_markup = re.sub(r'<table\b.*?</table>', '', source['extmetadata']['Artist']['value'], flags=re.I | re.S)
    author = ' '.join(html.unescape(re.sub('<[^>]+>', ' ', artist_markup)).split())
    author = re.sub(r'\s*/\s*', ' / ', author)
    assert entry['creator'] == author, entry['id'] + ' author differs from source metadata'
    assert (entry.get('source_width',entry['width']), entry.get('source_height',entry['height'])) == (source['width'], source['height'])
    with Image.open(path) as image:
        assert image.size == (entry['width'], entry['height'])
    assert len(entry['source_sha256']) == 64
    assert entry['source_page'] in (ROOT / 'CREDITS.md').read_text()
keys = ('id','title','theme','magnification','credit','license','license_url','source_page','local_image')
compact = [{k:e[k] for k in keys} for e in catalogue]
expected = (ROOT / 'scripts/transform.template.js').read_text().replace('__CATALOGUE__', json.dumps(compact, ensure_ascii=False, separators=(',', ':')))
assert (ROOT / 'src/transform.js').read_text() == expected, 'Run python scripts/build.py'
for layout in ('full','half_horizontal','half_vertical','quadrant'):
    assert '{{ unseen_exhibit }}' in (ROOT / f'src/{layout}.liquid').read_text()
    assert '{{ unseen_titlebar }}' in (ROOT / f'src/{layout}.liquid').read_text()
assert '<div class="title_bar">' in (ROOT / 'src/shared.liquid').read_text()
assert 'image-dither' in (ROOT / 'src/shared.liquid').read_text()
assert len(json.loads((ROOT / 'data/ping.json').read_text())) > 0
print(f'PASS: {len(catalogue)} PNGs, image hashes, source/credit records, generated transform and four layouts.')
