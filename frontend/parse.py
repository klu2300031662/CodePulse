import re
import json

with open('prepinsta.html', 'r', encoding='utf-8') as f:
    text = f.read()

# prepinsta table of contents links or table rows usually contain the items.
matches = re.findall(r'<a href=\"([^"]+)\"[^>]*>([^<]+)</a>', text)

problems = []
seen = set()
for href, title in matches:
    title = title.strip()
    if not title or len(title) > 80:
        continue
    # Filter out common non-problem links
    if any(x in title.lower() for x in ['login', 'register', 'home', 'syllabus', 'courses', 'contact', 'about', 'privacy', 'terms', 'buy', 'prepinsta', 'code', 'here']):
        continue
    # Many prepinsta problems have specific words or are in a specific list, but we can just grab things that look like problem titles...
    # Top 100 codes are typically things like "Reverse a number", "Fibonacci Series"
    if title not in seen:
        problems.append({
            "title": title,
            "url": href if href.startswith('http') else 'https://prepinsta.com' + href,
            "platform": "PrepInsta",
            "difficulty": "Medium"
        })
        seen.add(title)

# If it grabbed too many, we can limit it or filter better, but let's just save for now
with open('src/lib/data/prepinsta.json', 'w', encoding='utf-8') as f:
    json.dump(problems, f, indent=2)

print(f"Extracted {len(problems)} problems.")
