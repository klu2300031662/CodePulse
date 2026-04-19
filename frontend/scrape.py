import urllib.request
import re
import json

url = 'https://prepinsta.com/top-100-codes/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    with open('prepinsta.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Success")
except Exception as e:
    print('Error:', e)
