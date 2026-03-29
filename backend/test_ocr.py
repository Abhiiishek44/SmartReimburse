"""
Quick test script to verify OCR functionality with an existing receipt.
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ocr_service import parse_receipt

# Test with one of the existing receipts
receipt_path = Path(__file__).parent / "uploads" / "receipts" / "44cd7e071b364e2fa126d93f69f9b0b0.png"

if not receipt_path.exists():
    print(f"❌ Receipt not found: {receipt_path}")
    sys.exit(1)

print(f"📸 Testing OCR with: {receipt_path.name}")
print("─" * 60)

with open(receipt_path, "rb") as f:
    image_bytes = f.read()

result = parse_receipt(image_bytes, "image/png")

print("✅ OCR Results:")
print(f"   Amount:      {result['amount']}")
print(f"   Date:        {result['date']}")
print(f"   Vendor:      {result['vendor']}")
print(f"   Category:    {result['category']}")
print(f"   Description: {result['description'][:100]}...")
print("─" * 60)
print(f"📝 Raw Text (first 300 chars):\n{result['raw_text'][:300]}...")
