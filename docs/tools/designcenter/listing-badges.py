# 디자인센터 등록 이미지 3장 + 기능 배지 (목록에서 셀링 포인트가 보이게)
#   py docs/tools/designcenter/listing-badges.py
# 입력 : _deploy/dc/desk.png (PC 1280×820) · mobile-list.png (휴대폰 390×844 @2x) — dcshot.js 로 찍는다
# 출력 : _deploy/dc/badge/main.jpg 372×372 · display.jpg 330×489 · thumb.jpg 330×450
#        PC 화면 + 휴대폰 화면 위에 왼쪽 아래로 초록 배지 5개
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DC = os.path.join(os.path.dirname(__file__), '..', '..', '..', '_deploy', 'dc')
OUT = os.path.join(DC, 'badge'); os.makedirs(OUT, exist_ok=True)
desk = Image.open(os.path.join(DC, 'desk.png')).convert('RGB')
mob = Image.open(os.path.join(DC, 'mobile-list.png')).convert('RGB')
BG = (240, 240, 240, 255)
FONT = 'C:/Windows/Fonts/malgunbd.ttf'
ICON = 'C:/Windows/Fonts/seguisym.ttf'
BADGES = [('★', '쿠폰 뽑기'), ('⏱', '타임세일'), ('⌛', '마감 카운트다운'), ('✔', '룩북 체크 구매'), ('✎', '쉬운 편집')]
GREEN, EDGE, INK = (92, 230, 60), (30, 110, 20), (12, 20, 10)

def rr(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255); return m

def shadow(canvas, box, r, blur=10, off=(0, 6), alpha=70):
    s = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); d = ImageDraw.Draw(s)
    x0, y0, x1, y1 = box; d.rounded_rectangle([x0 + off[0], y0 + off[1], x1 + off[0], y1 + off[1]], r, fill=(40, 30, 20, alpha))
    canvas.alpha_composite(s.filter(ImageFilter.GaussianBlur(blur)))

def pc(c, x, y, w):
    h = int(w * desk.height / desk.width); d = desk.resize((w, h), Image.LANCZOS)
    shadow(c, (x, y, x + w, y + h), 8); c.paste(d, (x, y), rr(d, 8)); return h

def phone(c, x, y, w):
    h = int(w * 1.95); m = mob.crop((0, 0, mob.width, int(mob.width * 1.95))).resize((w, h), Image.LANCZOS)
    shadow(c, (x - 4, y - 4, x + w + 4, y + h + 4), 16, 12, (0, 8), 90)
    f = Image.new('RGBA', (w + 8, h + 8), (17, 17, 17, 255)); c.paste(f, (x - 4, y - 4), rr(f, 16)); c.paste(m, (x, y), rr(m, 12))

def badges(c, x, y, size, gap):
    ft, fi = ImageFont.truetype(FONT, size), ImageFont.truetype(ICON, size)
    hgt = size + 12
    for icon, text in BADGES:
        d = ImageDraw.Draw(c)
        iw, tw = d.textlength(icon, font=fi), d.textlength(text, font=ft)
        w = int(12 + iw + 6 + tw + 14)
        shadow(c, (x, y, x + w, y + hgt), hgt // 2, 4, (0, 3), 90)
        d = ImageDraw.Draw(c)
        d.rounded_rectangle([x, y, x + w, y + hgt], hgt // 2, fill=GREEN, outline=EDGE, width=2)
        cy = y + hgt / 2
        d.text((x + 12, cy), icon, font=fi, fill=INK, anchor='lm')
        d.text((x + 12 + iw + 6, cy), text, font=ft, fill=INK, anchor='lm')
        y += hgt + gap

def build(name, W, H, pcw, phw, badge_y, size, gap):
    c = Image.new('RGBA', (W, H), BG)
    ph = pc(c, (W - pcw) // 2, 12, pcw)
    phone(c, W - phw - 14, H - int(phw * 1.95) - 14, phw)
    badges(c, 12, badge_y, size, gap)
    p = os.path.join(OUT, name + '.jpg'); c.convert('RGB').save(p, quality=90)
    print(name, c.size, os.path.getsize(p))

build('main', 372, 372, 348, 104, 150, 13, 6)
build('display', 330, 489, 306, 124, 222, 14, 9)
build('thumb', 330, 450, 306, 116, 206, 14, 8)
