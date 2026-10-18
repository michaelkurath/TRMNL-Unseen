# UNSEEN — a hidden world, every day

Version 0.2.0 · expanded collection · 18 October 2026

Sixty real scanning electron micrographs: familiar materials, natural structures, minerals and nanostructures. Photographs from MUSE and contributors at the University of Tartu; individual credits and licences are recorded for every plate. One plate per local calendar day, with no repetition for 60 days. Refreshes within that day keep the same plate.

## Review first

Open `previews/index.html` for the image gallery. The collection is also available in six comparison sheets, `previews/collection-01-10.png` through `previews/collection-51-60.png`. The preview images simulate monochrome OG and 16-gray TRMNL X output. They use the actual Liquid layouts and a snapshot of the official TRMNL Framework. Pillow supplies local Floyd–Steinberg photo dithering for OG; TRMNL's hosted image pipeline may produce a different texture. These are not photographs of a physical device or authenticated cloud renders.

All four layouts are included. OG full view uses a narrow caption panel beside the photograph; X full view uses a caption below it. The complete field of view is retained, including original scale bars. In portrait and narrow mashups, letterboxing is deliberate. Original capture magnification is labelled as capture magnification; it is not the magnification of the resized display image.

## Install on TRMNL

This repository is linked to TRMNL plugin **510793**. The plugin ID and sync configuration are retained in the source. The owner confirmed the v0.1.0 live TRMNL rendering works on 18 October 2026. The expanded v0.2.0 collection has local layout and image checks; its live rendering still needs a refresh after GitHub sync. The public recipe has not been published.

1. The public images are included in this repository. Use `https://raw.githubusercontent.com/michaelkurath/TRMNL-Unseen/main` as the Public collection URL. No separate hosting account or GitHub Pages setup is required.
2. Open the existing UNSEEN Private Plugin (ID **510793**), using Polling. The polling URL is `https://raw.githubusercontent.com/michaelkurath/TRMNL-Unseen/main/data/ping.json`; refresh hourly. This small file triggers scheduled processing; the Serverless output supplies the date and subject. The day changes at the first successful refresh after local midnight, not necessarily exactly at midnight.
3. Add the custom fields from `src/settings.yml`. Keep the default Public collection URL above, or set your own HTTPS mirror without a trailing slash.
4. Paste `src/transform.js` into the Serverless tab, choosing Node. Paste `src/shared.liquid` into Shared and each remaining `.liquid` file into its corresponding layout tab. Enable Remove Bleed Margin.
5. Force Refresh and verify the four layouts on your account. Review the licence credits and outbound image requests before public release.

There are no API keys and no runtime image-generation calls. Serverless emits one plate, not the entire catalogue. The image files are fetched separately from the public host and passed through TRMNL's `image-dither` platform handling.

## Reproduce the checks

Prerequisites: Node 20+, Python 3, Pillow, and a Playwright-compatible Chromium browser.

```sh
npm install
npx playwright install chromium
python -m pip install Pillow
npm test
python scripts/validate.py
npm run render
python scripts/quantize.py
```

If Chromium is installed elsewhere, set `CHROMIUM_PATH` when running the render script. `scripts/render.js` compiles the actual Shared + layout Liquid with LiquidJS, renders the framework at OG/X geometry (including X portrait), verifies images decode, and measures text containment. `previews/layout-report.json` contains the measurements. The local preview server is started and stopped automatically.

For trmnlp: serve this directory with `python -m http.server 4568`, then run `trmnlp serve` from a second terminal in the same directory. The included `.trmnlp.yml` supplies the local asset root. This prototype was checked with the included render workflow; trmnlp itself was not available in the build environment.

`scripts/collect.py` can re-fetch source images and attribution from Wikimedia Commons. It is not needed to use the bundled PNGs. The source TIFFs are omitted to reduce download size; their URLs and SHA-256 hashes are retained in `data/catalogue.json`. `scripts/build.py` rebuilds the embedded transform catalogue and credits after editorial changes. The original ten plates retain their order and the 17 October 2026 epoch; the new plates follow them. Changing collection length can change selections after the original ten-day window.

## Optional GitHub Pages gallery

In repository **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**. After GitHub finishes deployment, the gallery will be at `https://michaelkurath.github.io/TRMNL-Unseen/`. Pages is optional: the TRMNL image source already uses the public repository.

## Image rights and code

Photographs and prepared derivatives use CC BY-SA 3.0, CC BY-SA 4.0 or CC BY 4.0, as individually listed. Attribution, licence links, source links and modification notices appear in `CREDITS.md`; a short credit remains on screen even when captions are disabled. Keep each image's corresponding licence on distributed derivatives. Code is MIT, separately from the photographs. The official framework and Inter font retain their own notices under `vendor/`.

## Next release gate

Sync the expanded collection from GitHub and Force Refresh. Check representative new plates in the live full and mashup previews before public release. The existing live integration is confirmed by the owner; the expanded catalogue repeats after 60 days.
