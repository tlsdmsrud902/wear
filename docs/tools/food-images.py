# 새 식품 사진(저장소 루트 ChatGPT 이미지) → 스킨용 webp / 상품 jpg 만들기
#   python3 docs/tools/food-images.py [skin|products|logo]   (저장소 루트에서 실행, Pillow 필요 : pip install pillow)
import glob, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'food902_s2_260925195134_d_skin1_E/skin1/SkinImg/food')
PRD = os.path.join(ROOT, 'cafe24-assets/products')

def src(key):  # 파일 이름의 시각(예: 01_56_40)으로 원본 찾기
    return glob.glob(os.path.join(ROOT, '*' + key + '*.png'))[0]

S = {
    # 정사각 1254 (연출 사진)
    'veg': '01_56_40', 'brunch': '01_56_43', 'cake': '01_56_44', 'bowl': '01_56_45', 'tea': '01_56_46',
    'bakery': '01_56_47', 'fruit': '01_56_48', 'pantry': '01_56_50', 'ramen': '01_56_52', 'gift': '01_56_53',
    # 가로 1536×1024 (요리)
    'salmon': '02_55_17', 'toast': '02_55_30', 'granola': '02_55_41', 'noodle': '02_55_51', 'sandwich': '02_56_37',
    # 가로 1672×941 (상품 단독 컷, 오른쪽에 상품)
    'bread': '02_57_15-1', 'juice': '02_57_15-2', 'salad': '02_57_17', 'pasta': '02_57_18', 'cheese': '02_57_19',
    'oat': '02_57_21', 'nuts': '02_57_22', 'oil': '02_57_23', 'choco': '02_57_24', 'giftbox': '02_57_26',
}
# 쓰지 않은 사진 : 02_08_52 ~ 02_09_04 (02_57_* 와 같은 상품의 넓은 배너판, 02_08_55 는 실제 파스타 브랜드 포장)
#                02_57_48 (문구가 들어간 배너 시안 모음)

def crop(key, ratio, cx=.5, cy=.5, s=1.0):
    """ratio = 가로/세로, (cx, cy) = 중심 비율, s = 들어갈 수 있는 최대 크기 대비 비율"""
    im = Image.open(src(S[key])).convert('RGB')
    w, h = im.size
    cw, ch = (w, w / ratio) if w / h < ratio else (h * ratio, h)
    cw, ch = cw * s, ch * s
    x = min(max(0, w * cx - cw / 2), w - cw)
    y = min(max(0, h * cy - ch / 2), h - ch)
    return im.crop((round(x), round(y), round(x + cw), round(y + ch)))

def webp(name, img, size):
    img.resize(size, Image.LANCZOS).save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)

SCENES = {  # 가로 장면 1672×941 (16:9)
    'scene-brunch': ('brunch', .5, .5), 'scene-market': ('veg', .5, .5), 'scene-toast': ('toast', .5, .5),
    'scene-fruit': ('fruit', .5, .5), 'scene-noodle': ('noodle', .5, .5), 'scene-granola': ('granola', .5, .5),
    'scene-sandwich': ('sandwich', .5, .5), 'scene-pantry': ('pantry', .5, .55),
    'scene-tea': ('tea', .5, .45), 'scene-salmon': ('salmon', .5, .55), 'scene-cake': ('cake', .5, .45),
    'scene-ramen': ('ramen', .5, .5), 'scene-bakery': ('bakery', .5, .5),
    'scene-giftbox': ('giftbox', .5, .5),
}
SQUARES = {  # 정사각 1254
    'sq-bowl': ('bowl', .5, .5), 'sq-fruit': ('fruit', .5, .5), 'sq-veg': ('veg', .5, .5), 'sq-tea': ('tea', .5, .5),
    'sq-cake': ('cake', .5, .5), 'sq-gift': ('giftbox', .72, .55, .85), 'sq-bakery': ('bakery', .5, .5),
    'sq-pantry': ('pantry', .5, .5), 'sq-ramen': ('ramen', .5, .5), 'sq-brunch': ('brunch', .5, .5),
    'sq-salmon': ('salmon', .5, .5), 'sq-toast': ('toast', .5, .5),
}
CARDS = {  # 세로 3:4 카드 1086×1448
    'card-fresh': ('fruit', .5, .5), 'card-meal': ('ramen', .55, .5),
}
PORTRAIT = {  # 세로 4:5 1122×1402
    'portrait-brunch': ('brunch', .5, .5), 'portrait-bakery': ('bakery', .5, .5),
}
PRODUCTS = [  # 상품 이미지 800×800 (code, 사진, cx, cy, s)
    ('p01', 'veg', .5, .5, 1), ('p02', 'fruit', .5, .5, 1), ('p03', 'juice', .7, .6, .8),
    ('p04', 'salad', .72, .58, .8), ('p05', 'veg', .42, .4, .32), ('p06', 'veg', .15, .42, .3),
    ('p07', 'fruit', .38, .45, .3), ('p08', 'fruit', .66, .38, .3), ('p09', 'tea', .6, .5, .75),
    ('p10', 'brunch', .2, .55, .35),
    ('p11', 'salmon', .5, .55, .85), ('p12', 'toast', .5, .5, .9), ('p13', 'granola', .5, .5, .9),
    ('p14', 'noodle', .5, .55, .9), ('p15', 'sandwich', .45, .5, .9), ('p16', 'ramen', .5, .5, .85),
    ('p17', 'bowl', .5, .5, .85), ('p18', 'oat', .72, .6, .8), ('p19', 'pasta', .7, .6, .8),
    ('p20', 'brunch', .5, .5, 1),
    ('p21', 'bread', .7, .6, .8), ('p22', 'bakery', .25, .5, .55), ('p23', 'choco', .66, .6, .8),
    ('p24', 'cake', .5, .5, .9), ('p25', 'cheese', .8, .58, .9), ('p26', 'nuts', .68, .58, .9),
    ('p27', 'oil', .74, .6, .85), ('p28', 'giftbox', .72, .55, .85), ('p29', 'pantry', .5, .5, 1),
    ('p30', 'gift', .62, .62, .7),
]

def text_logo(name, size, text, font_px, color, font='/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'):
    """글자 로고 (배경 투명)"""
    from PIL import ImageDraw, ImageFont
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(font, font_px)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    d.text(((size[0] - (r - l)) / 2 - l, (size[1] - (b - t)) / 2 - t), text, font=f, fill=color)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', lossless=True)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(PRD, exist_ok=True)
    only = sys.argv[1] if len(sys.argv) > 1 else ''
    if only in ('', 'skin'):
        for n, (k, *c) in SCENES.items(): webp(n, crop(k, 16 / 9, *c), (1672, 941))
        for n, (k, *c) in SQUARES.items(): webp(n, crop(k, 1, *c), (1254, 1254))
        for n, (k, cx, cy) in CARDS.items(): webp(n, crop(k, 3 / 4, cx, cy), (1086, 1448))
        for n, (k, cx, cy) in PORTRAIT.items(): webp(n, crop(k, 4 / 5, cx, cy), (1122, 1402))
    if only in ('', 'products'):
        for code, k, cx, cy, s in PRODUCTS:
            crop(k, 1, cx, cy, s).resize((800, 800), Image.LANCZOS).save(os.path.join(PRD, code + '.jpg'), quality=85)
    if only in ('', 'logo'):
        text_logo('logo-food902', (560, 200), 'food902', 120, (47, 58, 40, 255))
        text_logo('wordmark-food902', (2146, 724), 'food902', 480, (196, 122, 62, 255))
    print('done')
