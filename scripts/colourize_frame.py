"""Create uncropped false-colour JPEGs from the original UNSEEN grayscale plates."""

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PALETTES = {
    "surirella": "#157d80",
    "copper": "#b45b26",
    "paper": "#334fa3",
}

for plate in json.loads((ROOT / "data/catalogue.json").read_text())["entries"]:
    if plate["id"] not in PALETTES:
        continue
    target = ROOT / plate["frame_image"]
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(ROOT / plate["local_image"]) as original:
        grayscale = original.convert("L")
        grayscale.thumbnail((2560, 2560), Image.Resampling.LANCZOS)
        colour = ImageOps.colorize(grayscale, "black", "white", PALETTES[plate["id"]])
        colour.save(target, quality=85, subsampling=2, optimize=True)
