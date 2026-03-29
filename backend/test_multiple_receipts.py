"""Test OCR on multiple receipts"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ocr_service import parse_receipt

receipts_dir = Path(__file__).parent / "uploads" / "receipts"
receipt_files = list(receipts_dir.glob("*.png"))[:5]

for receipt_path in receipt_files:
    print(f"\n📸 {receipt_path.name}")
    with open(receipt_path, "rb") as f:
        result = parse_receipt(f.read(), "image/png")
    print(f"   Amount: {result['amount']}, Vendor: {result['vendor']}, Category: {result['category']}")
    print(f"   Text preview: {result['raw_text'][:80]}...")
