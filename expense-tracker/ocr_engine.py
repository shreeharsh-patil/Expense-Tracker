"""
Receipt OCR Engine for Spendly
Extracts amount and category from uploaded receipt images.
Uses Pillow for image processing and regex for amount extraction.
Falls back gracefully if Tesseract is not installed.
"""

import re
import os

# Try importing pytesseract; if Tesseract binary isn't installed, we'll
# fall back to a simpler approach using just the filename/metadata.
try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
    
    # Common Tesseract install paths on Windows
    for path in [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\shree\AppData\Local\Tesseract-OCR\tesseract.exe',
    ]:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break
except ImportError:
    TESSERACT_AVAILABLE = False


# Category keywords mapping
CATEGORY_KEYWORDS = {
    'Food': ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'coffee', 'tea',
             'swiggy', 'zomato', 'dining', 'bakery', 'grocery', 'supermarket',
             'dmart', 'bigbasket', 'blinkit', 'milk', 'chicken', 'rice',
             'kitchen', 'biryani', 'hotel', 'canteen', 'mess'],
    'Transport': ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel',
                  'parking', 'toll', 'cab', 'auto', 'bus', 'train', 'irctc',
                  'flight', 'airline', 'redbus'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'mall',
                 'clothing', 'shoes', 'electronics', 'mobile', 'laptop',
                 'nykaa', 'reliance'],
    'Bills': ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband',
              'jio', 'airtel', 'vi', 'bsnl', 'recharge', 'rent', 'emi',
              'insurance', 'maintenance', 'society'],
    'Entertainment': ['netflix', 'spotify', 'hotstar', 'prime', 'movie',
                      'cinema', 'pvr', 'inox', 'game', 'playstation',
                      'xbox', 'steam', 'concert', 'event'],
    'Health': ['pharmacy', 'medical', 'hospital', 'doctor', 'clinic',
               'apollo', 'medicine', 'lab', 'test', 'health', 'gym',
               'fitness', 'yoga', 'wellness'],
}


def extract_amounts(text):
    """Extract all currency amounts from OCR text."""
    patterns = [
        r'(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)',      # Rs. 500, ₹1,200.50
        r'(?:total|amount|grand\s*total|net|bill)\s*:?\s*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)',
        r'([\d,]+\.\d{2})',                          # Any decimal number like 1234.56
    ]
    
    amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            try:
                val = float(m.replace(',', ''))
                if 1.0 <= val <= 500000:  # Reasonable expense range
                    amounts.append(val)
            except ValueError:
                continue
    
    return amounts


def guess_category(text):
    """Guess expense category from OCR text using keyword matching."""
    text_lower = text.lower()
    scores = {}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score
    
    if scores:
        return max(scores, key=scores.get)
    return 'Other'


def process_receipt(image_path):
    """
    Process a receipt image and extract structured data.
    Returns dict with: amount, category, raw_text, confidence, method
    """
    result = {
        'amount': None,
        'category': 'Other',
        'description': '',
        'raw_text': '',
        'confidence': 'low',
        'method': 'none',
    }
    
    if not os.path.exists(image_path):
        return result

    if TESSERACT_AVAILABLE:
        # Dynamically resolve tesseract_cmd if not set (handles installations post-server start)
        current_cmd = getattr(pytesseract.pytesseract, 'tesseract_cmd', None)
        if not current_cmd or not os.path.exists(current_cmd):
            for path in [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                r'C:\Users\shree\AppData\Local\Tesseract-OCR\tesseract.exe',
            ]:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break

        try:
            img = Image.open(image_path)
            
            # Convert to grayscale for better OCR
            img = img.convert('L')
            
            # Extract text
            raw_text = pytesseract.image_to_string(img, lang='eng')
            result['raw_text'] = raw_text
            result['method'] = 'tesseract'
            
            # Extract amounts
            amounts = extract_amounts(raw_text)
            if amounts:
                # The largest amount is usually the total
                result['amount'] = max(amounts)
                result['confidence'] = 'high' if len(amounts) >= 2 else 'medium'
            
            # Guess category
            result['category'] = guess_category(raw_text)
            
            # Build a short description from first meaningful line
            lines = [l.strip() for l in raw_text.split('\n') if l.strip() and len(l.strip()) > 3]
            if lines:
                result['description'] = lines[0][:60]
                
        except Exception as e:
            result['method'] = 'error'
            result['raw_text'] = f'OCR Error: {str(e)}'
    else:
        result['method'] = 'fallback'
        result['raw_text'] = 'Tesseract not installed. Please enter details manually.'
    
    return result
