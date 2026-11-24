"""Builds the portrait images of the figures from Wikimedia Commons.

Usage: python scripts/build-portraits.py [--force]

Every figure whose content file has a `portrait` record gets
public/portraits/<slug>.webp: the square named by the record's `crop`, cut out
of the picture on Wikimedia Commons and scaled down for the medallion. Images
that already exist are kept unless --force is given, so the script can be run
again after adding a portrait. Images without a record are removed. The
pictures fetched from Commons are kept under tmp/portrait-sources, so that
changing a crop and running the script with --force fetches nothing again.

Which pictures may be used, and why, is decided when the record is written
(content/rules/RULESET.md, section 8; content/portraits/REVIEW.md). The images
are committed, so that the application never loads a picture from another
server. Requires Pillow.
"""

import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FIGURES_DIR = ROOT / "content" / "figures"
OUTPUT_DIR = ROOT / "public" / "portraits"
# Pictures as fetched from Commons, kept so that a crop can be adjusted without fetching the picture again; not committed.
CACHE_DIR = ROOT / "tmp" / "portrait-sources"
API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "HistoryJourneysContentBuild/0.1 (open-source content build script)"
# Width asked of Commons: enough for a sharp crop of a face out of a full-length portrait. It is one of the
# standard thumbnail widths of Wikimedia; other widths are rendered on demand and refused when asked for too often.
SOURCE_WIDTH = 960
# Side of the stored square; the largest medallion is 66 pixels wide, so this covers screens of triple density.
OUTPUT_SIZE = 200
WEBP_QUALITY = 82
# Commons limits how fast files may be fetched; the script waits between files and backs off when told to.
PAUSE_SECONDS = 6
RETRY_SECONDS = 90
MAX_ATTEMPTS = 8
# The API accepts up to 50 titles in one request.
BATCH_SIZE = 40


def fetch(url: str) -> bytes:
    """Fetches a URL, waiting and trying again when Commons asks the script to slow down."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == MAX_ATTEMPTS:
                raise
            wait = retry_delay(error.headers.get("Retry-After"))
            print(f"  Commons asks to slow down; waiting {wait} s")
            time.sleep(wait)
    raise RuntimeError("unreachable")


def retry_delay(header: str | None) -> int:
    """Seconds to wait before trying again; the header may hold seconds, a date, or be missing."""
    try:
        return int(header) if header else RETRY_SECONDS
    except ValueError:
        return RETRY_SECONDS


def read_portraits() -> dict[str, dict]:
    """Returns the portrait record of every figure that has one, by slug."""
    portraits = {}
    for path in sorted(FIGURES_DIR.glob("*.json")):
        figure = json.loads(path.read_text(encoding="utf-8"))
        if "portrait" in figure:
            portraits[figure["slug"]] = figure["portrait"]
    return portraits


def image_urls(files: list[str]) -> dict[str, str]:
    """Asks Commons for a scaled-down version of each file; returns the address by file name."""
    urls: dict[str, str] = {}
    for start in range(0, len(files), BATCH_SIZE):
        batch = files[start : start + BATCH_SIZE]
        query = urllib.parse.urlencode(
            {
                "action": "query",
                "format": "json",
                "titles": "|".join(f"File:{name}" for name in batch),
                "prop": "imageinfo",
                "iiprop": "url",
                "iiurlwidth": str(SOURCE_WIDTH),
            }
        )
        data = json.loads(fetch(f"{API_URL}?{query}"))
        if "query" not in data:
            sys.exit(f"Commons refused the request for {', '.join(batch)}: {data.get('error', data)}")
        renamed = {item["to"]: item["from"] for item in data["query"].get("normalized", [])}
        for page in data["query"]["pages"].values():
            title = renamed.get(page["title"], page["title"]).removeprefix("File:")
            info = (page.get("imageinfo") or [{}])[0]
            if "thumburl" in info:
                urls[title] = info["thumburl"]
    return urls


def cache_path(slug: str, record: dict) -> Path:
    """Where the fetched picture of a figure is kept; a record that names another file gets another path."""
    return CACHE_DIR / f"{slug}-{zlib.crc32(record['file'].encode('utf-8')):08x}.img"


def crop_box(size: tuple[int, int], crop: dict) -> tuple[int, int, int, int]:
    """The square of the record in pixels: at least one pixel, at most the shorter side, and moved inwards where it would reach over an edge."""
    width, height = size
    side = max(1, min(round(crop["size"] * width), width, height))
    left = min(max(round(crop["x"] * width - side / 2), 0), width - side)
    top = min(max(round(crop["y"] * height - side / 2), 0), height - side)
    return left, top, left + side, top + side


def crop_square(image: Image.Image, crop: dict) -> Image.Image:
    """Cuts the square of the record out of the picture and scales it to the size of the stored image."""
    return image.crop(crop_box(image.size, crop)).resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)


def main() -> None:
    force = "--force" in sys.argv[1:]
    portraits = read_portraits()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for stray in OUTPUT_DIR.glob("*.webp"):
        if stray.stem not in portraits:
            stray.unlink()
            print(f"removed {stray.name}: no portrait record")

    wanted = {slug: record for slug, record in portraits.items() if force or not (OUTPUT_DIR / f"{slug}.webp").exists()}
    if not wanted:
        print(f"{len(portraits)} portraits, all present")
        return
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    to_fetch = {slug: record for slug, record in wanted.items() if not cache_path(slug, record).exists()}
    urls = image_urls([record["file"] for record in to_fetch.values()]) if to_fetch else {}
    missing = [slug for slug, record in to_fetch.items() if record["file"] not in urls]
    if missing:
        sys.exit(f"Commons has no such file for: {', '.join(missing)}")

    for slug, record in wanted.items():
        cached = cache_path(slug, record)
        if not cached.exists():
            time.sleep(PAUSE_SECONDS)
            cached.write_bytes(fetch(urls[record["file"]]))
        with Image.open(io.BytesIO(cached.read_bytes())) as source:
            crop_square(source.convert("RGB"), record["crop"]).save(OUTPUT_DIR / f"{slug}.webp", "WEBP", quality=WEBP_QUALITY)
        print(f"{slug}.webp")
    print(f"{len(portraits)} portraits, {len(wanted)} built")


if __name__ == "__main__":
    main()
