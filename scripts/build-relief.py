"""Builds the shaded relief image of the painted map from Natural Earth.

Usage: python scripts/build-relief.py <path to SR_50M.tif>

Source: Natural Earth "Shaded Relief Basic", 1:50m (public domain),
https://www.naturalearthdata.com/downloads/50m-raster-data/50m-shaded-relief/

The source is an equirectangular image of the whole world. The script crops it
to the region of the game, reprojects it to the Mercator projection the map
uses and writes a small greyscale image to public/geo/relief.jpg. The region is
read from MAP_REGION in src/map/mapRegion.ts.
Requires Pillow and NumPy.
"""

import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "public" / "geo" / "relief.jpg"
MAP_REGION_PATH = ROOT / "src" / "map" / "mapRegion.ts"
OUTPUT_WIDTH = 2048
JPEG_QUALITY = 72
NEUTRAL_GREY = 128

# The source is one trusted file of the whole world (10800 x 5400 pixels), larger than the size at which Pillow
# refuses an image as a possible decompression bomb. The script reads nothing else.
Image.MAX_IMAGE_PIXELS = None


def read_map_region() -> tuple[float, float, float, float]:
    """Reads west, south, east and north from MAP_REGION, the single definition of the game region."""
    source = MAP_REGION_PATH.read_text(encoding="utf-8")
    block = re.search(r"MAP_REGION\s*=\s*\{(.*?)\}", source, re.DOTALL)
    if not block:
        sys.exit(f"MAP_REGION was not found in {MAP_REGION_PATH}")
    values = dict(re.findall(r"(west|south|east|north):\s*(-?\d+(?:\.\d+)?)", block.group(1)))
    missing = [side for side in ("west", "south", "east", "north") if side not in values]
    if missing:
        sys.exit(f"MAP_REGION in {MAP_REGION_PATH} lacks: {', '.join(missing)}")
    west, south, east, north = (float(values[side]) for side in ("west", "south", "east", "north"))
    if not (west < east and south < north):
        sys.exit(f"MAP_REGION is not a valid region: west {west}, south {south}, east {east}, north {north}")
    return west, south, east, north


def mercator_y(latitude: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(latitude) / 2))


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/build-relief.py <path to SR_50M.tif>")
    west, south, east, north = read_map_region()
    with Image.open(sys.argv[1]) as image:
        source = np.asarray(image.convert("L"), dtype=np.float32)
    source_height, source_width = source.shape

    top, bottom = mercator_y(north), mercator_y(south)
    output_height = round(OUTPUT_WIDTH * (top - bottom) / math.radians(east - west))

    # For every output pixel, find the source pixel at the same longitude and latitude.
    longitudes = west + (np.arange(OUTPUT_WIDTH) + 0.5) / OUTPUT_WIDTH * (east - west)
    mercator_rows = top - (np.arange(output_height) + 0.5) / output_height * (top - bottom)
    latitudes = np.degrees(2 * np.arctan(np.exp(mercator_rows)) - math.pi / 2)
    columns = np.clip(((longitudes + 180) / 360 * source_width).astype(int), 0, source_width - 1)
    rows = np.clip(((90 - latitudes) / 180 * source_height).astype(int), 0, source_height - 1)
    relief = source[np.ix_(rows, columns)]

    # Centre flat ground on mid-grey, the neutral value of the "overlay" blend the map paints the
    # relief with, and stretch the contrast so that mountain shadows and highlights are clearly visible.
    flat = np.median(relief)
    spread = np.percentile(np.abs(relief - flat), 99)
    if spread == 0:
        sys.exit("The cropped relief is completely flat; check the source image and the map region.")
    relief = np.clip(NEUTRAL_GREY + (relief - flat) / spread * NEUTRAL_GREY, 0, 255)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(relief.astype(np.uint8), mode="L").save(OUTPUT_PATH, quality=JPEG_QUALITY, optimize=True)
    print(f"{OUTPUT_PATH.name}: {OUTPUT_WIDTH}x{output_height}, {OUTPUT_PATH.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
