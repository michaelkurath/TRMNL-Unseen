# Unseen — a hidden world, every day

Version 0.2.3 · standard title bar · 18 October 2026

Sixty real scanning electron micrographs: familiar materials, natural structures, minerals and nanostructures. Photographs from MUSE and contributors at the University of Tartu; individual credits and licences are recorded for every plate. Daily mode (the default) keeps one plate per local calendar day, with no repetition for 60 days. Every refresh mode advances through the collection each time the plugin refreshes, then loops after all 60 plates.

## Preview the collection

Open `previews/index.html` for the image gallery. The collection is also available in six comparison sheets, `previews/collection-01-10.png` through `previews/collection-51-60.png`. The preview images simulate monochrome OG and 16-gray TRMNL X output. They use the actual Liquid layouts and a snapshot of the official TRMNL Framework. Pillow supplies local Floyd–Steinberg photo dithering for OG; TRMNL's hosted image pipeline may produce a different texture. These are not photographs of a physical device or authenticated cloud renders.

All four layouts use the standard TRMNL `title_bar`, as a direct sibling after the `layout`. It shows Unseen and the plate number, with no custom title-bar CSS. Photo credit and licence remain in a separate attribution line, including when captions are off. All four layouts are included. OG full view uses a narrow caption panel beside the photograph; X full view uses a caption below it. The complete field of view is retained, including original scale bars. In portrait and narrow mashups, letterboxing is deliberate. Original capture magnification is labelled as capture magnification; it is not the magnification of the resized display image.

## Install on TRMNL

The public recipe is being prepared and is not published yet. Once available, installation will copy the layouts, Serverless code and settings automatically. No API key or separate hosting account is needed.

1. Leave **Public collection URL** at `https://raw.githubusercontent.com/michaelkurath/TRMNL-Unseen/main`.
2. Choose **Daily** for one picture per local calendar day, or **Every refresh** for a new plate at each plugin data refresh.
3. Choose whether to show the subject caption. Photo credit and licence always remain visible.
4. Save and add Unseen to your device playlist. **Force Refresh** requests a new data render; replaying a cached playlist screen does not advance the plate. Hourly refresh is the default. Daily mode changes at the first successful refresh after local midnight.

For development or a manual private-plugin installation:

1. Create a Private Plugin with **Polling**, **Node Serverless**, Framework **3.4.3**, and **Remove Bleed Margin** enabled.
2. Add the custom fields from `src/settings.yml`. The polling URL is `{{ assets_base_url }}/data/ping.json` and the default refresh interval is 60 minutes.
3. Paste `src/transform.js` into Serverless, `src/shared.liquid` into Shared, and the four remaining `.liquid` files into the corresponding layout tabs.
4. Upload `assets/branding/unseen-icon.png` as the plugin icon. Save, Force Refresh and check the preview.

The repository's plugin ID **510793** identifies the author's linked development instance; do not reuse it for another account. There are no runtime image-generation calls. Serverless emits one plate, not the entire catalogue. Images load separately from the public repository and use TRMNL's `image-dither` handling.

Questions or rendering problems? [Open a GitHub issue](https://github.com/michaelkurath/TRMNL-Unseen/issues) with your device, layout, picture mode and plate number.

## Picture change modes

Choose **Picture change mode** in plugin settings:

- **Daily** (default): one picture per local calendar day. Repeated refreshes keep the same picture.
- **Every refresh**: the next picture on each scheduled plugin data refresh or **Force Refresh**. All 60 pictures appear before the cycle repeats. Replaying an already cached screen in your device playlist does not advance the picture.

TRMNL Saved State remembers the last plate, including across Force Refresh. Switching from Daily to Every refresh advances from the last displayed daily plate; switching back restores the calendar selection. A fresh install or cleared/obsolete saved cursor starts on the current daily plate. Invalid image-host settings do not advance the cursor. State uses a single plate ID, without storing the collection or image data. See [TRMNL Saved State](https://help.trmnl.com/en/articles/16777795-saved-state).

Import the latest GitHub changes into TRMNL **before saving the plugin settings**. Saving the older live plugin first exports its old source back to GitHub and can remove the new field and Serverless logic. The GitHub link alone is not an import; on this plugin's settings page, use **GitHub-Synchronisierung → Von GitHub importieren** (Import from GitHub). After importing, select **Every refresh**, save, then Force Refresh twice to verify two different plates.

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

## Release verification

The standard title bar was verified in the authenticated TRMNL editor on 18 October 2026. All four layouts were checked on OG 1-bit, X landscape and X portrait: 12 live previews, decoded images, visible attribution and no measured clipping. See `data/live-layout-review.json`. These checks use the hosted editor; they are not photographs of a physical device.

The 25 rotation/payload tests pass. The title-bar update also has 46 local layout checks, including long credits, captions off and setup states; the earlier 406 collection checks remain recorded separately. Live Every refresh advancement from plate 003 to 004 is documented in `data/live-validation.json`.

The monochrome 512 × 512 diatom icon and editable SVG are in `assets/branding/`. The marketplace copy and outstanding submission steps are recorded in `RELEASE.md`. Public submission and AI Chef review are not yet complete.
