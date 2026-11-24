"""Generates the application icons under public/icons.

Usage: python scripts/build-icons.py

The icon is an original design: a gold compass star on a wax-red shield over a
dark stone background. Requires Pillow.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"
STONE = (27, 22, 18, 255)
WAX = (138, 31, 23, 255)
WAX_DARK = (85, 17, 12, 255)
GOLD = (201, 164, 76, 255)
GOLD_BRIGHT = (240, 213, 134, 255)
SUPERSAMPLE = 4


def shield_points(cx: float, cy: float, half_width: float, height: float) -> list[tuple[float, float]]:
    """Outline of a heater shield centred on (cx, cy)."""
    top = cy - height / 2
    points = [(cx - half_width, top), (cx + half_width, top), (cx + half_width, cy)]
    steps = 24
    for step in range(steps + 1):
        angle = math.pi * step / steps
        points.append((cx + half_width * math.cos(angle), cy + (height / 2) * math.sin(angle)))
    points.append((cx - half_width, cy))
    return points


def star_points(cx: float, cy: float, outer: float, inner: float, rays: int) -> list[tuple[float, float]]:
    """Outline of a star with the given number of rays, alternating outer and inner radius; the first ray points up."""
    points = []
    for index in range(rays * 2):
        radius = outer if index % 2 == 0 else inner
        angle = math.pi * index / rays - math.pi / 2
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def draw_icon(size: int, shield_scale: float) -> Image.Image:
    """Draws the icon; shield_scale leaves the safe zone a maskable icon needs."""
    canvas = size * SUPERSAMPLE
    image = Image.new("RGBA", (canvas, canvas), STONE)
    draw = ImageDraw.Draw(image)
    centre = canvas / 2
    half_width = canvas * 0.36 * shield_scale
    height = canvas * 0.84 * shield_scale
    draw.polygon(shield_points(centre, centre, half_width * 1.07, height * 1.05), fill=GOLD)
    draw.polygon(shield_points(centre, centre, half_width, height), fill=WAX)
    draw.polygon(shield_points(centre, centre + height * 0.03, half_width * 0.86, height * 0.86), outline=WAX_DARK, width=max(canvas // 90, 1))
    draw.polygon(star_points(centre, centre - height * 0.04, half_width * 0.72, half_width * 0.2, 4), fill=GOLD_BRIGHT)
    draw.polygon(star_points(centre, centre - height * 0.04, half_width * 0.42, half_width * 0.16, 8), fill=GOLD)
    return image.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    draw_icon(192, 1.0).save(OUTPUT_DIR / "icon-192.png")
    draw_icon(512, 1.0).save(OUTPUT_DIR / "icon-512.png")
    draw_icon(512, 0.72).save(OUTPUT_DIR / "icon-512-maskable.png")
    print(f"Icons written to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
