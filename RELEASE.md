# Unseen release preparation

## Marketplace copy

Name: **Unseen**

Short description: **Discover the microscopic world**

Discover the hidden structures in familiar things. Unseen brings 60 real scanning electron micrographs to your TRMNL: butterfly wings, paper, minerals, nanostructures and engineered materials.

Choose a picture each day or advance on every plugin refresh. Captions are optional; the photographer and licence stay visible. Works in all four layouts on TRMNL OG and X, including X portrait. No API key or separate hosting is required.

Photographs are credited individually to MUSE and University of Tartu contributors under CC BY and CC BY-SA licences. These are real microscope photographs, not AI-generated scientific images.

## Completed checks

- Standard Framework title bar across all four layouts.
- 12 authenticated live editor previews: four layouts × OG, X landscape, X portrait; no measured clipping, credits visible, images decoded.
- 25 rotation/payload tests and 60 image integrity/source checks.
- 46 local title-bar render checks, including long credits, captions off and setup states.
- Every refresh mode was verified advancing through live plates 003 and 004.
- Original 512 × 512 diatom icon, editable SVG and MIT licence; icon saved in the live plugin.
- TRMNL marketplace featured image generated and confirmed (800 × 480).
- Setup instructions, refresh semantics, source credits and support link.

## Submission status — 18 October 2026

Submitted publicly under the owner-approved TRMNL Plugin License. TRMNL confirmed “Submitted! We'll be in touch soon.” and created a Recipe Review ticket. The saved settings now show “Blaupause wird geprüft” (recipe under review). This is a pending review, not public publication.

The first Chef check required a category; `images,education` was added. AI Chef review 1227 then returned two suggestions and one nitpick, with no critical findings:

- Prefer Framework typography/color utilities over custom caption and credit CSS.
- Consider a side-by-side caption on X to reduce letterboxing.
- Avoid repeating the plate number in the caption and title bar.

Submitted the tested layouts for human review with these refinements recorded. The native title bar, actual layout wrapper and responsive CSS are present; the simpler automated source scan's missing-include/layout/responsive-class hints do not reflect the rendered Shared capture structure. Twelve hosted layout checks and 46 local title-bar checks remain available.

The GitHub import reset this instance's picture mode to Daily. Every refresh was restored and saved after submission. The recipe's default remains Daily for new installations.

## Remaining

- Await human review and address returned feedback.
- Check readability on a physical device; hosted previews cannot prove physical e-paper output.

See `data/submission.json` and `previews/submitted-review.jpg` for the submission record.
