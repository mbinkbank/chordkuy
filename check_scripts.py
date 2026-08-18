import urllib.request
import re

req = urllib.request.Request('https://chordkuy.id', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
scripts = re.findall(r'<script[^>]*src="([^"]+)"', html)
print('Script src tags:', scripts)
