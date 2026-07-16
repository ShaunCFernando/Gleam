"""Automated first-pass filter for product photos: reject anything that
isn't a clear, in-focus shot on a plain white/light background. This exists
because photos bulk-imported from a crowdsourced database (Open Beauty
Facts) vary wildly in quality — blurry shots, cluttered backgrounds, hands
holding the product, close-ups of the ingredient label, etc.

This is a heuristic, not a guarantee: it catches the two things pixel
analysis can reliably measure (background brightness/uniformity, sharpness).
It will NOT catch every obstruction (e.g. a hand against a white wall could
pass). Treat it as a pre-filter — a human visual pass is still the final
word for anything already in the catalog.
"""

from io import BytesIO

import requests
from PIL import Image, ImageFilter, ImageStat

MIN_DIMENSION = 80  # reject only genuinely tiny thumbnails — product bottles/tubes are legitimately narrow
CORNER_FRACTION = 0.12  # size of each corner sample, as a fraction of image dimension
WHITE_BG_MIN_MEAN = 215  # corners must be at least this bright (0-255) on average
WHITE_BG_MAX_STDDEV = 30  # ...and fairly uniform (low texture/clutter) in the corners
MIN_SHARPNESS = 6.0  # stddev of an edge-detected grayscale image; low = blurry/flat


def _corner_crops(im: Image.Image):
    w, h = im.size
    cw, ch = int(w * CORNER_FRACTION), int(h * CORNER_FRACTION)
    boxes = [
        (0, 0, cw, ch),
        (w - cw, 0, w, ch),
        (0, h - ch, cw, h),
        (w - cw, h - ch, w, h),
    ]
    return [im.crop(box) for box in boxes]


def passes_quality_bar(image_bytes: bytes) -> tuple[bool, str]:
    """Returns (passed, reason). `reason` explains a rejection, or is "ok"."""
    try:
        im = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return False, "unreadable image"

    if im.width < MIN_DIMENSION or im.height < MIN_DIMENSION:
        return False, f"too small ({im.width}x{im.height})"

    corners = _corner_crops(im)
    means, stddevs = [], []
    for corner in corners:
        stat = ImageStat.Stat(corner)
        means.append(sum(stat.mean) / len(stat.mean))
        stddevs.append(sum(stat.stddev) / len(stat.stddev))

    corner_mean = sum(means) / len(means)
    corner_stddev = sum(stddevs) / len(stddevs)
    if corner_mean < WHITE_BG_MIN_MEAN:
        return False, f"corners not white/light (mean brightness {corner_mean:.0f})"
    if corner_stddev > WHITE_BG_MAX_STDDEV:
        return False, f"corners too busy/textured (stddev {corner_stddev:.0f})"

    edges = im.convert("L").filter(ImageFilter.FIND_EDGES)
    sharpness = ImageStat.Stat(edges).stddev[0]
    if sharpness < MIN_SHARPNESS:
        return False, f"too blurry/flat (sharpness {sharpness:.1f})"

    return True, "ok"


def fetch_and_check(image_url: str, timeout: float = 15) -> tuple[bool, str]:
    try:
        resp = requests.get(image_url, timeout=timeout)
        resp.raise_for_status()
    except requests.RequestException as exc:
        return False, f"download failed: {exc}"
    return passes_quality_bar(resp.content)
