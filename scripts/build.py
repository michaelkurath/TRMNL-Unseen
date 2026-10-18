"""Build TRMNL source, credits and preview data from the verified catalogue."""
import json, textwrap
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
entries=json.loads((ROOT/'data/catalogue.json').read_text())['entries']
compact=[{k:e[k] for k in ('id','title','theme','magnification','credit','license','license_url','source_page','local_image')} for e in entries]
template=(ROOT/'scripts/transform.template.js').read_text()
(ROOT/'src/transform.js').write_text(template.replace('__CATALOGUE__',json.dumps(compact,ensure_ascii=False,separators=(',',':'))))
for layout in ('full','half_horizontal','half_vertical','quadrant'):
 (ROOT/f'src/{layout}.liquid').write_text('<div class="layout unseen-layout">{{ unseen_exhibit }}</div>\n')
(ROOT/'data/ping.json').write_text('{"collection":"UNSEEN","version":"0.1.0"}\n')
credits=['# UNSEEN image credits\n','All ten source photographs: Nicola Angeli / MUSE. Images are CC BY-SA 3.0.\n','Prepared PNGs preserve the full microscope field of view and scale bars. They are grayscale conversions, without generated or reconstructed image content. Preview derivatives are resized and dithered. Image derivatives remain CC BY-SA 3.0.\n']
for e in entries:
 credits += [f"## {e['title']}\n",f"- Source: {e['source_page']}\n- Author: {e['credit']}\n- Licence: {e['license']} — {e['license_url']}\n- Changes: {e['changes']}\n- Magnification: {e['magnification'] or 'Not stated; no value inferred'}. File-label magnifications describe the original capture; resizing changes displayed magnification.\n"]
credits += ['\nTRMNL Framework assets are from https://trmnl.com/css/latest/plugins.css and https://trmnl.com/js/latest/plugins.js, retrieved 2026-10-17. Framework source: https://github.com/usetrmnl/trmnl-framework (MIT); see vendor/LICENSE-TRMNL.txt. Inter font: The Inter Project Authors (SIL OFL 1.1); see vendor/fonts/OFL-Inter.txt. The snapshot is included for reproducible visual previews.\n']
(ROOT/'CREDITS.md').write_text('\n'.join(credits))
print('Built four layouts, embedded catalogue and credits.')
