"""Tests of the cropping in scripts/build-portraits.py. Run with: python -m unittest discover scripts/tests"""

import importlib.util
import unittest
from pathlib import Path

from PIL import Image

SCRIPT = Path(__file__).resolve().parent.parent / "build-portraits.py"
spec = importlib.util.spec_from_file_location("build_portraits", SCRIPT)
build_portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_portraits)


def picture(width: int, height: int) -> Image.Image:
    """A picture whose every pixel tells its own position: red is the column, green is the row."""
    image = Image.new("RGB", (width, height))
    image.putdata([(x, y, 0) for y in range(height) for x in range(width)])
    return image


class CropBoxTest(unittest.TestCase):
    def test_square_around_the_centre_of_the_record(self):
        self.assertEqual(build_portraits.crop_box((200, 100), {"x": 0.5, "y": 0.5, "size": 0.25}), (75, 25, 125, 75))

    def test_square_is_moved_inwards_at_the_left_and_top_edges(self):
        self.assertEqual(build_portraits.crop_box((200, 100), {"x": 0.0, "y": 0.0, "size": 0.25}), (0, 0, 50, 50))

    def test_square_is_moved_inwards_at_the_right_and_bottom_edges(self):
        self.assertEqual(build_portraits.crop_box((200, 100), {"x": 1.0, "y": 1.0, "size": 0.25}), (150, 50, 200, 100))

    def test_square_is_never_larger_than_the_shorter_side(self):
        self.assertEqual(build_portraits.crop_box((200, 100), {"x": 0.5, "y": 0.5, "size": 1.0}), (50, 0, 150, 100))

    def test_square_is_never_empty(self):
        left, top, right, bottom = build_portraits.crop_box((200, 100), {"x": 0.5, "y": 0.5, "size": 0.0001})
        self.assertEqual((right - left, bottom - top), (1, 1))


class CropSquareTest(unittest.TestCase):
    def test_output_has_the_size_of_the_medallion_image(self):
        result = build_portraits.crop_square(picture(200, 100), {"x": 0.5, "y": 0.5, "size": 0.25})
        self.assertEqual(result.size, (build_portraits.OUTPUT_SIZE, build_portraits.OUTPUT_SIZE))

    def test_output_shows_the_part_of_the_picture_the_record_names(self):
        result = build_portraits.crop_square(picture(200, 100), {"x": 0.5, "y": 0.5, "size": 0.25})
        red, green, _ = result.getpixel((build_portraits.OUTPUT_SIZE // 2, build_portraits.OUTPUT_SIZE // 2))
        # The middle of the crop is the middle of the picture: column 100, row 50.
        self.assertAlmostEqual(red, 100, delta=2)
        self.assertAlmostEqual(green, 50, delta=2)


class RetryDelayTest(unittest.TestCase):
    def test_seconds_are_taken_from_the_header(self):
        self.assertEqual(build_portraits.retry_delay("12"), 12)

    def test_a_date_or_a_missing_header_gives_the_default(self):
        self.assertEqual(build_portraits.retry_delay("Wed, 21 Oct 2026 07:28:00 GMT"), build_portraits.RETRY_SECONDS)
        self.assertEqual(build_portraits.retry_delay(None), build_portraits.RETRY_SECONDS)


if __name__ == "__main__":
    unittest.main()
