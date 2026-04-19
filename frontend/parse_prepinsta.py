import re
import json

with open('prepinsta.html', 'r', encoding='utf-8') as f:
    html = f.read()

matches = re.findall(r'<a[^>]*href=\"([^\"]+)\"[^>]*>([^<]+)</a>', html)
problems = []
seen = set()
for href, title in matches:
    title = title.strip()
    tl = title.lower()
    if 'number' in tl or 'sum' in tl or 'palindrome' in tl or 'array' in tl or 'string' in tl or 'sort' in tl or 'leap year' in tl or 'prime' in tl or 'armstrong' in tl or 'fibonacci' in tl or 'factorial' in tl:
        if len(title) > 3 and title not in seen and not tl.startswith('click'):
            problems.append({
                'title': title,
                'url': href if href.startswith('http') else 'https://prepinsta.com' + href,
                'platform': 'PrepInsta',
                'difficulty': 'Medium',
                'status': 'Attempted'
            })
            seen.add(title)

print(f'Found {len(problems)} problems')
with open('src/lib/data/prepinsta.json', 'w', encoding='utf-8') as f:
    json.dump(problems[:40], f, indent=2)
