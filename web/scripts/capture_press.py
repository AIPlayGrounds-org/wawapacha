"""Capture the real press behind each paper card: the clipped passage that holds its lift.

Run from web/ after `bun scripts/list-cards.ts > .cache/cards.json`:

    python scripts/capture_press.py .cache/cards.json

It writes WebP files to app/assets/press/ and the manifest app/data/press.ts, which imports
them so the build resolves the site's base path. A card whose lift
cannot be found keeps its typed paper card; the script says which.
"""

import hashlib
import io
import json
import re
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'app' / 'assets' / 'press'
CACHE = ROOT / '.cache' / 'press'
MANIFEST = ROOT / 'app' / 'data' / 'press.ts'
# A source whose rights holder asked us to take its image down: one link per line. Its card goes back to the typed phrase on the next run.
OPT_OUT = ROOT / 'scripts' / 'press-optout.txt'
MAX_WIDTH = 1200
SOFT_HYPHEN = chr(0xAD)
UA = 'Mozilla/5.0 (compatible; press-capture)'


def key(href: str, lift: str) -> str:
    return hashlib.sha1(f'{href}#{lift}'.encode()).hexdigest()[:12]


def norm(text: str) -> str:
    text = unicodedata.normalize('NFKC', text).replace(SOFT_HYPHEN, '')
    return re.sub(r'\s+', ' ', text).strip().lower()


def fetch(url: str) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / hashlib.sha1(url.encode()).hexdigest()
    if cached.exists():
        return cached.read_bytes()
    request = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    cached.write_bytes(data)
    return data


def save(image: Image.Image, name: str) -> dict:
    if image.width > MAX_WIDTH:
        image = image.resize((MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    image.convert('RGB').save(OUT / f'{name}.webp', 'WEBP', quality=78, method=6)
    return {'name': name, 'width': image.width, 'height': image.height}


def fold(text: str) -> str:
    """Lowercase without accents or punctuation, so a PDF's text layer matches the lift."""
    text = unicodedata.normalize('NFKD', norm(text))
    return re.sub(r'[^a-z0-9 ]', '', ''.join(c for c in text if not unicodedata.combining(c)))


def pdf_link(html: bytes, url: str) -> str | None:
    """The file behind a repository or download page."""
    text = html.decode('utf-8', 'ignore')
    found = re.findall(r"(https?://[^\"'\s<>]*wpdmdl=[^\"'\s<>]*)", text) or re.findall(
        r'href="([^"]*/bitstreams/[^"]*/download)"', text
    )
    if not found:
        return None
    link = found[0].replace('&amp;', '&')
    return link if link.startswith('http') else re.match(r'https?://[^/]+', url).group(0) + link


MARKER = (255, 214, 92, 110)


def mark(image: Image.Image, boxes: list[tuple[float, float, float, float]]) -> Image.Image:
    """Run a highlighter over the lifted words, as a reader would on a clipping."""
    layer = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for x0, y0, x1, y1 in boxes:
        draw.rectangle((x0 - 2, y0 + (y1 - y0) * 0.12, x1 + 2, y1 + (y1 - y0) * 0.06), fill=MARKER)
    return Image.alpha_composite(image.convert('RGBA'), layer)


def pdf_clip(data: bytes, lift: str) -> Image.Image | None:
    doc = fitz.open(stream=data, filetype='pdf')
    target = fold(lift).split()
    for size in (len(target), 6, 4):
        probe = target[:size]
        for page in doc:
            words = page.get_text('words')
            folded = [fold(w[4]) for w in words]
            for start in range(len(words) - len(probe) + 1):
                if folded[start : start + len(probe)] != probe:
                    continue
                hits = words[start : start + len(target)]
                # The lifted words alone, with a little air, so the type stays readable on a card.
                clip = fitz.Rect()
                for w in hits:
                    clip |= fitz.Rect(w[:4])
                line = hits[0][3] - hits[0][1]
                clip = (clip + (-0.6 * line, -0.15 * line, 0.6 * line, 0.15 * line)) & page.rect
                zoom = 220 / 72
                pix = page.get_pixmap(clip=clip, dpi=220)
                image = Image.open(io.BytesIO(pix.tobytes('png')))
                boxes = [
                    ((w[0] - clip.x0) * zoom, (w[1] - clip.y0) * zoom, (w[2] - clip.x0) * zoom, (w[3] - clip.y0) * zoom)
                    for w in hits
                ]
                return mark(image, boxes)
    return None


FIND = """(lift) => {
  const words = lift.split(/\s+/)
  for (const probe of [lift, words.slice(0, 6).join(' '), words.slice(0, 4).join(' ')]) {
    getSelection().removeAllRanges()
    if (!window.find(probe, false, false, true)) continue
    const range = getSelection().getRangeAt(0)
    const block = range.startContainer.parentElement.closest('h1, h2, h3, p, li, blockquote, td, div')
    block.scrollIntoView({ block: 'center' })
    return true
  }
  return false
}"""

# Measured after the scroll settles, in viewport coordinates, so late layout shifts do not move it.
MEASURE = """() => {
  const range = getSelection().rangeCount ? getSelection().getRangeAt(0) : null
  if (!range) return null
  const block = range.startContainer.parentElement.closest('h1, h2, h3, p, li, blockquote, td, div')
  const marks = [...range.getClientRects()].map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height }))
  getSelection().removeAllRanges()
  if (!marks.length) return null
  const top = Math.min(...marks.map((m) => m.y)), bottom = Math.max(...marks.map((m) => m.y + m.h))
  let left = Math.min(...marks.map((m) => m.x)), right = Math.max(...marks.map((m) => m.x + m.w))
  if (/^H[1-3]$/.test(block.tagName)) {
    // A headline is clipped whole, the way a reader would cut it out.
    const b = block.getBoundingClientRect()
    left = b.left; right = b.right
  }
  return { x: left, width: right - left, y: top, height: bottom - top, marks }
}"""


def page_clip(page, url: str, lift: str) -> Image.Image | None:
    page.goto(url, wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(3000)
    if not page.evaluate(FIND, lift):
        return None
    page.wait_for_timeout(1200)
    box = page.evaluate(MEASURE)
    if not box or box['width'] < 40:
        return None
    pad = 10
    x0, y0 = max(0, box['x'] - pad), max(0, box['y'] - pad)
    width = min(box['width'] + 2 * pad, 1100 - x0)
    png = page.screenshot(clip={'x': x0, 'y': y0, 'width': width, 'height': box['height'] + 2 * pad})
    image = Image.open(io.BytesIO(png))
    scale = image.width / width
    boxes = [
        ((m['x'] - x0) * scale, (m['y'] - y0) * scale, (m['x'] + m['w'] - x0) * scale, (m['y'] + m['h'] - y0) * scale)
        for m in box['marks']
    ]
    return mark(image, boxes)


def main(cards_path: str) -> None:
    cards = json.loads(Path(cards_path).read_text(encoding='utf-8'))
    opted_out = (
        {line.strip() for line in OPT_OUT.read_text(encoding='utf-8').splitlines() if line.strip() and not line.startswith('#')}
        if OPT_OUT.exists()
        else set()
    )
    cards['paper'] = [card for card in cards['paper'] if card['href'] not in opted_out]
    clippings, missed = {}, []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome')
        page = browser.new_page(viewport={'width': 1100, 'height': 900}, user_agent=UA, device_scale_factor=2)
        for card in cards['paper']:
            name = key(card['href'], card['lift'])
            try:
                data = fetch(card['href'])
                if data[:4] != b'%PDF' and (link := pdf_link(data, card['href'])):
                    data = fetch(link)
                image = pdf_clip(data, card['lift']) if data[:4] == b'%PDF' else page_clip(page, card['href'], card['lift'])
            except Exception as error:  # a source that is down keeps its typed card
                image = None
                print(f'  error {card["href"][:70]}: {str(error)[:80]}')
            if image is None:
                missed.append(f'{card["outlet"]} {card["published"]}: {card["lift"][:50]}')
                continue
            clippings[f'{card["href"]}#{card["lift"]}'] = save(image, name)
        browser.close()

    def ident(name: str) -> str:
        return 'img_' + re.sub(r'[^A-Za-z0-9]', '_', name)

    def entries(images: dict) -> list[str]:
        return [
            f"  {json.dumps(k, ensure_ascii=False)}: {{ src: {ident(v['name'])}, width: {v['width']}, height: {v['height']} }},"
            for k, v in images.items()
        ]

    names = [v['name'] for v in clippings.values()]
    out = ['// Generated by scripts/capture_press.py. Do not edit.']
    out += [f"import {ident(n)} from '~/assets/press/{n}.webp'" for n in names]
    out += [
        '',
        'export type PressImage = { readonly src: string; readonly width: number; readonly height: number }',
        '',
        '/** The lifted passage of each paper card as printed, keyed by `href#lift`. */',
        'export const clippings: Readonly<Record<string, PressImage>> = {',
        *entries(clippings),
        '}',
        '',
    ]
    MANIFEST.write_text(chr(10).join(out), encoding='utf-8')
    # The manifest is generated, but CI checks formatting, so leave it formatted.
    subprocess.run(['bunx', 'oxfmt', str(MANIFEST)], cwd=ROOT, check=True, shell=sys.platform == 'win32')
    print(f'{len(clippings)} clippings')
    for line in missed:
        print('  kept typed:', line)


if __name__ == '__main__':
    main(sys.argv[1])
