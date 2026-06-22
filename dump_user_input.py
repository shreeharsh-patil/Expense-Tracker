import json
import os

log_path = r"C:\Users\shree\.gemini\antigravity-ide\brain\8323daec-6c85-4948-a8e2-5503ed92e211\.system_generated\logs\transcript.jsonl"
output_path = r"d:\expense-tracker\user_code.tsx"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find the user input type
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                if 'export default function HtmlPublishedJun172026806PmUtcBody' in content:
                    with open(output_path, 'w', encoding='utf-8') as out_f:
                        out_f.write(content)
                    print(f"Successfully extracted code to {output_path}")
        except Exception as e:
            print(f"Error parsing line: {e}")
