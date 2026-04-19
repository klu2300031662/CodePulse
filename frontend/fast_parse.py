import json

with open('prepinsta.html', 'r', encoding='utf-8') as f:
    html = f.read()

problems = []
seen = set()

parts = html.split('<a ')
for p in parts[1:]:
    if 'href="' in p:
        href_start = p.split('href="')[1]
        if '"' in href_start:
            href = href_start.split('"')[0]
            if '>' in p:
                content_start = p.split('>')[1]
                if '</a' in content_start:
                    title = content_start.split('</a')[0].strip()
                    
                    tl = title.lower()
                    if 'number' in tl or 'sum' in tl or 'palindrome' in tl or 'array' in tl or 'string' in tl or 'sort' in tl or 'leap year' in tl or 'prime' in tl or 'armstrong' in tl or 'fibonacci' in tl or 'factorial' in tl:
                        if len(title) > 3 and title not in seen and not tl.startswith('click') and not '<' in title:
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
