/**
 * Receipt OCR Engine for Spendly
 * Extracts amount and category from uploaded receipt images.
 * Uses tesseract.js.
 */

const fs = require('fs');
const Tesseract = require('tesseract.js');

// Category keywords mapping
const CATEGORY_KEYWORDS = {
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
};

function extract_amounts(text) {
    const patterns = [
        /(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)/gi,
        /(?:total|amount|grand\s*total|net|bill)\s*:?\s*(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d*)/gi,
        /([\d,]+\.\d{2})/g
    ];

    const amounts = [];
    for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            try {
                // For matches, we capture the number portion
                const matchVal = match[1] || match[0];
                const val = parseFloat(matchVal.replace(/,/g, ''));
                if (!isNaN(val) && val >= 1.0 && val <= 500000) {
                    amounts.push(val);
                }
            } catch (err) {
                // Ignore conversion errors
            }
        }
    }
    return amounts;
}

function guess_category(text) {
    const text_lower = text.toLowerCase();
    const scores = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (text_lower.includes(kw)) {
                score++;
            }
        }
        if (score > 0) {
            scores[category] = score;
        }
    }

    const keys = Object.keys(scores);
    if (keys.length > 0) {
        return keys.reduce((a, b) => scores[a] > scores[b] ? a : b);
    }
    return 'Other';
}

async function process_receipt(image_path) {
    const result = {
        amount: null,
        category: 'Other',
        description: '',
        raw_text: '',
        confidence: 'low',
        method: 'none',
    };

    if (!fs.existsSync(image_path)) {
        return result;
    }

    try {
        const { data: { text } } = await Tesseract.recognize(image_path, 'eng');
        result.raw_text = text;
        result.method = 'tesseract.js';

        // Extract amounts
        const amounts = extract_amounts(text);
        if (amounts.length > 0) {
            result.amount = Math.max(...amounts);
            result.confidence = amounts.length >= 2 ? 'high' : 'medium';
        }

        // Guess category
        result.category = guess_category(text);

        // Build a short description from first meaningful line
        const lines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l && l.length > 3);
        if (lines.length > 0) {
            result.description = lines[0].substring(0, 60);
        }
    } catch (err) {
        result.method = 'error';
        result.raw_text = `OCR Error: ${err.message}`;
    }

    return result;
}

module.exports = {
    process_receipt
};
