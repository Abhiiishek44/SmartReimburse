"""
OCR Service — extracts structured expense data from receipt images.
Uses pytesseract + Pillow with preprocessing for better accuracy.
"""

import re
import io
from datetime import datetime
from typing import Optional

import pytesseract
from PIL import Image, ImageFilter, ImageEnhance

# ─── Category keyword map ─────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Travel":        ["uber", "lyft", "taxi", "flight", "airline", "hotel", "airbnb", "train", "bus", "metro", "parking", "toll", "fuel", "petrol", "gas station"],
    "Meals":         ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "dining", "bistro", "bakery", "sushi", "dominos", "mcdonalds", "kfc", "subway", "starbucks", "swiggy", "zomato"],
    "Accommodation": ["hotel", "inn", "resort", "lodge", "airbnb", "hostel", "motel"],
    "Equipment":     ["hardware", "laptop", "monitor", "keyboard", "mouse", "printer", "scanner", "cable", "charger", "electronics"],
    "Software":      ["software", "subscription", "license", "saas", "cloud", "aws", "azure", "google cloud", "github", "jira", "slack", "zoom"],
    "Training":      ["course", "training", "workshop", "seminar", "conference", "udemy", "coursera", "certification"],
    "Medical":       ["pharmacy", "hospital", "clinic", "doctor", "medicine", "medical", "health", "dental"],
}

# ─── Image preprocessing ──────────────────────────────────────────────────────

def _preprocess_image(image: Image.Image) -> Image.Image:
    """Convert to grayscale, enhance contrast, and apply threshold for better OCR."""
    # Convert to grayscale
    img = image.convert("L")
    # Upscale small images for better OCR
    w, h = img.size
    if w < 1000:
        scale = 1000 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    # Enhance contrast
    img = ImageEnhance.Contrast(img).enhance(2.0)
    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)
    # Binarize (threshold)
    img = img.point(lambda p: 255 if p > 140 else 0)
    return img


# ─── Text extraction ──────────────────────────────────────────────────────────

def extract_text_from_image(image_bytes: bytes, content_type: str) -> str:
    """Run Tesseract OCR on the uploaded image bytes and return raw text."""
    image = Image.open(io.BytesIO(image_bytes))
    # Convert RGBA/palette images to RGB before processing
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    processed = _preprocess_image(image)
    # PSM 6 = assume a single uniform block of text (good for receipts)
    config = "--psm 6 --oem 3"
    text = pytesseract.image_to_string(processed, config=config)
    return text.strip()


# ─── Parsers ──────────────────────────────────────────────────────────────────

def _parse_amount(text: str) -> Optional[float]:
    """Extract the largest monetary amount found in the text."""
    # Match currency symbols followed by numbers, or numbers followed by symbols
    patterns = [
        r"(?:total|amount|grand total|subtotal|sum)[^\d]*([₹$€£¥]?\s*\d[\d,]*\.?\d*)",
        r"([₹$€£¥])\s*(\d[\d,]*\.?\d*)",
        r"(\d[\d,]*\.\d{2})\s*(?:INR|USD|EUR|GBP)?",
    ]
    candidates = []
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw = match.group(1) if len(match.groups()) == 1 else match.group(2)
            raw = re.sub(r"[₹$€£¥,\s]", "", raw)
            try:
                candidates.append(float(raw))
            except ValueError:
                pass
    # Return the largest amount found (likely the total)
    return max(candidates) if candidates else None


def _parse_date(text: str) -> Optional[str]:
    """Extract the first recognizable date from the text."""
    date_patterns = [
        (r"\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b",   "%d/%m/%Y"),
        (r"\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b",   "%Y/%m/%d"),
        (r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b", None),
        (r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})\b", None),
    ]
    for pattern, fmt in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            continue
        try:
            if fmt:
                parts = [match.group(1), match.group(2), match.group(3)]
                date_str = "/".join(parts)
                parsed = datetime.strptime(date_str, fmt)
            else:
                parsed = datetime.strptime(match.group(0).strip(), "%d %B %Y") if match.group(0)[0].isdigit() else datetime.strptime(match.group(0).strip(), "%B %d %Y")
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def _parse_vendor(text: str) -> Optional[str]:
    """Extract vendor name from the top lines of the receipt."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # Skip very short lines or lines that look like addresses/numbers
    for line in lines[:6]:
        if len(line) > 3 and not re.match(r"^[\d\W]+$", line):
            return line
    return None


def _classify_category(text: str) -> str:
    """Classify expense category based on keyword matching."""
    lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "Other"


# ─── Main entry point ─────────────────────────────────────────────────────────

def parse_receipt(image_bytes: bytes, content_type: str) -> dict:
    """
    Full pipeline: extract text → parse fields → return structured dict.
    Returns: { amount, date, vendor, description, category }
    """
    raw_text = extract_text_from_image(image_bytes, content_type)

    if not raw_text:
        return {
            "amount": None,
            "date": None,
            "vendor": None,
            "description": "",
            "category": "Other",
            "raw_text": "",
        }

    return {
        "amount":      _parse_amount(raw_text),
        "date":        _parse_date(raw_text),
        "vendor":      _parse_vendor(raw_text),
        "description": raw_text[:500],   # cap description to 500 chars
        "category":    _classify_category(raw_text),
        "raw_text":    raw_text,
    }
