# WEARPICK 홍보 영상 : video/src 의 Flow 영상 · 화면 녹화 → 세로 15초(광고) · 가로 30초(크몽 · 디자인센터)
#   FONTS=<글꼴 폴더> python3 docs/tools/promo/promo-video.py
#   글꼴 폴더 : npm pack pretendard@1.3.9 @fontsource/jost @fontsource/playfair-display 를 풀어 둔 곳
#   결과 : video/promo/wearpick-15s-vertical.mp4 · wearpick-30s-horizontal.mp4 (소리 없음 — 광고 관리자에서 음악을 붙인다)
#   ⚠ 관리자 주소(?edit=1)는 자막 · 화면 어디에도 넣지 않는다
import os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC = os.path.join(REPO, 'video', 'src')
OUT = os.path.join(REPO, 'video', 'promo')
FONTS = os.environ['FONTS']
TMP = tempfile.mkdtemp(prefix='promo-')
FPS = 30
os.makedirs(OUT, exist_ok=True)

PRE = FONTS + '/pretendard-1.3.9/dist/public/static/Pretendard-{}.otf'
JOST = FONTS + '/fontsource-jost-5.3.0/files/jost-latin-{}-normal.woff2'
PLAY = FONTS + '/fontsource-playfair-display-5.3.0/files/playfair-display-latin-500-italic.woff2'
f_pre = lambda w, s: ImageFont.truetype(PRE.format(w), s)
f_jost = lambda w, s: ImageFont.truetype(JOST.format(w), s)
f_play = lambda s: ImageFont.truetype(PLAY, s)

# 휴대폰 초록 화면 자리 (Flow 원본 720×1280 기준, 프레임마다 ±6px 흔들림 → 조금 크게)
SCREEN = (203, 322, 310, 668)  # x, y, w, h
GREEN = '0x10C52C'


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def enc():
    return ['-an', '-r', str(FPS), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p']


# ---------- 글자 이미지 ----------
def spaced(d, xy, text, font, fill, spacing, anchor_center=False, W=None):
    w = sum(d.textlength(c, font=font) for c in text) + spacing * (len(text) - 1)
    x, y = xy
    if anchor_center: x = (W - w) / 2
    for c in text:
        d.text((x, y), c, font=font, fill=fill)
        x += d.textlength(c, font=font) + spacing
    return w


def caption(W, H, lines, where, kicker=None, size=None, name='cap'):
    """where : 'bottom' · 'top' (세로, 가운데 정렬) / 'right' (가로, 오른쪽 칸 왼쪽 정렬)"""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    size = size or (70 if W < H else 62)
    font = f_pre('ExtraBold', size)
    kf = f_jost(500, 26 if W < H else 22)
    lh = int(size * 1.32)
    block = lh * len(lines) + (56 if kicker else 0)
    if where in ('bottom', 'top'):
        # 글자 뒤 그라데이션 (읽기 쉽게)
        g = Image.new('L', (1, 256))
        for i in range(256): g.putpixel((0, i), int(170 * (i / 255) ** 1.4))
        band = 620
        g = g.resize((W, band))
        if where == 'top': g = g.transpose(Image.FLIP_TOP_BOTTOM)
        shade = Image.new('RGBA', (W, band), (0, 0, 0, 255)); shade.putalpha(g)
        im.alpha_composite(shade, (0, H - band if where == 'bottom' else 0))
        y = (1500 - block) if where == 'bottom' else 250
        if kicker:
            spaced(d, (0, y), kicker, kf, (255, 255, 255, 210), 7, True, W); y += 56
        for t in lines:
            tw = d.textlength(t, font=font)
            d.text(((W - tw) / 2 + 2, y + 3), t, font=font, fill=(0, 0, 0, 90))
            d.text(((W - tw) / 2, y), t, font=font, fill='white'); y += lh
    else:  # right
        x = 760; y = (H - block) / 2
        if kicker:
            spaced(d, (x, y), kicker, kf, (255, 255, 255, 200), 6); y += 56
        for t in lines:
            d.text((x, y), t, font=font, fill='white'); y += lh
    p = os.path.join(TMP, name + '.png'); im.save(p); return p


def end_card(W, H, name):
    im = Image.new('RGB', (W, H), (12, 12, 12))
    d = ImageDraw.Draw(im)
    v = W < H
    cy = H * (0.40 if v else 0.30)
    spaced(d, (0, cy), 'CAFE24 SHOP THEME', f_jost(500, 30 if v else 26), (170, 170, 170), 8, True, W)
    big = f_jost(600, 150 if v else 140)
    spaced(d, (0, cy + 60), 'WEARPICK', big, 'white', 14 if v else 12, True, W)
    sub = f_pre('Bold', 48 if v else 40)
    t = '카페24 여성 의류 쇼핑몰 스킨'
    d.text(((W - d.textlength(t, font=sub)) / 2, cy + (260 if v else 245)), t, font=sub, fill='white')
    f2 = f_pre('Medium', 34 if v else 30)
    t = '쿠폰 뽑기 · 타임세일 · 코딩 없이 편집'
    d.text(((W - d.textlength(t, font=f2)) / 2, cy + (340 if v else 315)), t, font=f2, fill=(185, 185, 185))
    d.line(((W / 2 - 30, cy + (430 if v else 390)), (W / 2 + 30, cy + (430 if v else 390))), fill=(90, 90, 90), width=2)
    f3 = f_pre('SemiBold', 34 if v else 28)
    t = '카페24 디자인센터 · 크몽에서 만나 보세요'
    d.text(((W - d.textlength(t, font=f3)) / 2, cy + (470 if v else 420)), t, font=f3, fill=(225, 225, 225))
    p = os.path.join(TMP, name + '.png'); im.save(p); return p


# ---------- 휴대폰 화면 합성 ----------
def screen_video(plan, name):
    """plan : [(이미지, 시작 y, 끝 y, 초)] — 이미지를 화면 폭에 맞춰 위에서 아래로 넘긴다 (y 는 원본 픽셀)"""
    sx, sy, sw, sh = SCREEN
    fr = os.path.join(TMP, name); os.makedirs(fr, exist_ok=True)
    n = 0
    for img, y0, y1, sec in plan:
        im = Image.open(os.path.join(SRC, 'screens', img)).convert('RGB')
        k = sw / im.width
        im = im.resize((sw, round(im.height * k)), Image.LANCZOS)
        frames = round(sec * FPS)
        for i in range(frames):
            t = i / max(frames - 1, 1)
            t = t * t * (3 - 2 * t)  # 부드럽게 시작 · 멈춤
            y = round((y0 + (y1 - y0) * t) * k)
            im.crop((0, y, sw, y + sh)).save(os.path.join(fr, f'{n:04d}.png')); n += 1
    out = os.path.join(TMP, name + '.mp4')
    ff('-framerate', str(FPS), '-i', os.path.join(fr, '%04d.png'), *enc(), out)
    return out, n / FPS


def phone_clip(plan, ss, name):
    scr, dur = screen_video(plan, name + '-screen')
    sx, sy, _, _ = SCREEN
    out = os.path.join(TMP, name + '.mp4')
    ff('-i', scr, '-ss', str(ss), '-t', f'{dur:.3f}', '-i', os.path.join(SRC, 'flow-3a-phone.mp4'), '-filter_complex',
       f'color=c=black:s=720x1280:r={FPS}:d={dur:.3f}[bg];[bg][0:v]overlay={sx}:{sy}[s];'
       f'[1:v]fps={FPS},chromakey={GREEN}:0.16:0.05,despill=type=green[p];[s][p]overlay=0:0:shortest=1',
       *enc(), out)
    return out, dur


# ---------- 컷 ----------
def cut_clip(fmt, src, ss, dur, cap, name):
    """세로 원본 영상(720×1280) → 세로는 꽉 채우고, 가로는 흐린 배경 + 왼쪽 영상"""
    out = os.path.join(TMP, name + '.mp4')
    if fmt == 'v':
        fc = f'[0:v]fps={FPS},scale=1080:1920:flags=lanczos,setsar=1[v];[v][1:v]overlay=0:0'
    else:
        fc = (f'[0:v]fps={FPS},split[a][b];[a]scale=1600:-2,crop=1600:900,boxblur=30:2,eq=brightness=-0.22[bg];'
              f'[b]scale=-2:900:flags=lanczos[fg];[bg][fg]overlay=170:0[v];[v][1:v]overlay=0:0,setsar=1')
    ff('-ss', str(ss), '-t', str(dur), '-i', src, '-loop', '1', '-t', str(dur), '-i', cap, '-filter_complex', fc, *enc(), out)
    return out


def cut_real_vertical(dur, cap, name):
    """실제 화면 : 이벤트 마감 카운트다운 + 쿠폰 뽑기 녹화"""
    out = os.path.join(TMP, name + '.mp4')
    ff('-f', 'lavfi', '-i', f'color=c=0x111111:s=1080x1920:r={FPS}:d={dur}',
       '-stream_loop', '-1', '-t', str(dur), '-i', os.path.join(SRC, 'rec-countdown-local.mp4'),
       '-ss', '6.5', '-t', str(dur), '-i', os.path.join(SRC, 'rec-coupon.mp4'),
       '-loop', '1', '-t', str(dur), '-i', cap, '-filter_complex',
       f'[1:v]fps={FPS},scale=1000:-2:flags=lanczos[cd];'
       f'[2:v]fps={FPS},crop=990:770:430:90,scale=1000:-2:flags=lanczos[cp];'
       f'[0:v][cd]overlay=40:560[a];[a][cp]overlay=40:735[b];[b][3:v]overlay=0:0,setsar=1',
       *enc(), out)
    return out


def cut_countdown_h(dur, cap, name):
    out = os.path.join(TMP, name + '.mp4')
    ff('-f', 'lavfi', '-i', f'color=c=0x111111:s=1600x900:r={FPS}:d={dur}',
       '-stream_loop', '-1', '-t', str(dur), '-i', os.path.join(SRC, 'rec-countdown-local.mp4'),
       '-loop', '1', '-t', str(dur), '-i', cap, '-filter_complex',
       f'[1:v]fps={FPS},scale=1400:-2:flags=lanczos[cd];[0:v][cd]overlay=100:480[a];[a][2:v]overlay=0:0,setsar=1',
       *enc(), out)
    return out


def cut_coupon_h(ss, dur, cap, name):
    out = os.path.join(TMP, name + '.mp4')
    ff('-ss', str(ss), '-t', str(dur), '-i', os.path.join(SRC, 'rec-coupon.mp4'), '-loop', '1', '-t', str(dur), '-i', cap,
       '-filter_complex', f'[0:v]fps={FPS},crop=1400:788:228:88,scale=1600:900:flags=lanczos[v];[v][1:v]overlay=0:0,setsar=1',
       *enc(), out)
    return out


def cut_end(png, dur, name):
    out = os.path.join(TMP, name + '.mp4')
    ff('-loop', '1', '-t', str(dur), '-i', png, '-vf', f'fps={FPS},fade=t=in:st=0:d=0.4,format=yuv420p,setsar=1', *enc(), out)
    return out


def chip(W, H, text, name):
    """가로 실제 화면 위 작은 설명 칩"""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = f_pre('Bold', 34); tw = d.textlength(text, font=f)
    d.rounded_rectangle((48, 40, 48 + tw + 56, 40 + 72), 36, fill=(17, 17, 17, 235))
    d.text((48 + 28, 40 + 15), text, font=f, fill='white')
    p = os.path.join(TMP, name + '.png'); im.save(p); return p


def join(parts, out):
    lst = os.path.join(TMP, os.path.basename(out) + '.txt')
    with open(lst, 'w') as fh:
        for p in parts: fh.write(f"file '{p}'\n")
    # 소리 없는 트랙을 붙여 둔다 (일부 업로드 화면이 오디오 트랙을 요구)
    ff('-f', 'concat', '-safe', '0', '-i', lst, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
       '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out)
    print('→', out)


# ---------- 세로 15초 ----------
def vertical():
    W, H = 1080, 1920
    P = lambda n: os.path.join(SRC, n)
    ph, d = phone_clip([('phone-home.png', 0, 0, 1.2), ('phone-sale.png', 0, 0, 1.3)], 1.0, 'v-phone')
    parts = [
        cut_clip('v', P('flow-1-paris.mp4'), 0.3, 3, caption(W, H, ['새 시즌 옷은 준비됐는데'], 'bottom', name='v1'), 'v1'),
        cut_clip('v', P('flow-2-studio.mp4'), 0.6, 3, caption(W, H, ['쇼핑몰은 아직이라면?'], 'bottom', name='v2'), 'v2'),
        cut_clip('v', ph, 0, d, caption(W, H, ['쿠폰 뽑기 · 타임세일까지', '다 들어 있는 스킨'], 'top', name='v3'), 'v3'),
        cut_real_vertical(2.5, caption(W, H, ['직접 뽑는 랜덤 쿠폰', '마감 카운트다운'], 'top', kicker='REAL SCREEN', size=66, name='v3b'), 'v3b'),
        cut_clip('v', P('flow-4-smile.mp4'), 0.4, 2, caption(W, H, ['오늘 바로 오픈'], 'bottom', name='v4'), 'v4'),
        cut_end(end_card(W, H, 'v5'), 2, 'v5'),
    ]
    join(parts, os.path.join(OUT, 'wearpick-15s-vertical.mp4'))


# ---------- 가로 30초 ----------
def horizontal():
    W, H = 1600, 900
    P = lambda n: os.path.join(SRC, n)
    ph, d = phone_clip([('phone-home.png', 0, 0, 1.4), ('phone-sale.png', 0, 0, 1.4),
                        ('phone-coupon-scroll.png', 0, 1000, 2.2)], 1.0, 'h-phone')
    parts = [
        cut_clip('h', P('flow-1-paris.mp4'), 0.3, 4, caption(W, H, ['새 시즌 옷은', '준비됐는데'], 'right', kicker='NEW SEASON', name='h1'), 'h1'),
        cut_clip('h', P('flow-2-studio.mp4'), 0.6, 4, caption(W, H, ['쇼핑몰은', '아직이라면?'], 'right', name='h2'), 'h2'),
        cut_clip('h', ph, 0, d, caption(W, H, ['쿠폰 뽑기 · 타임세일까지', '다 들어 있는', '여성 의류 쇼핑몰 스킨'], 'right', kicker='WEARPICK', name='h3'), 'h3'),
        cut_countdown_h(3, _top_h(W, H, 'REAL SCREEN', '이벤트 마감까지, 실시간 카운트다운', 'h4'), 'h4'),
        cut_coupon_h(4.6, 5, chip(W, H, '회원이 직접 뽑는 랜덤 쿠폰 · 5 ~ 50%', 'h5'), 'h5'),
        cut_clip('h', P('flow-4-smile.mp4'), 0.4, 5, caption(W, H, ['상품만 올리면', '오늘 바로 오픈'], 'right', name='h6'), 'h6'),
        cut_end(end_card(W, H, 'h7'), 5, 'h7'),
    ]
    join(parts, os.path.join(OUT, 'wearpick-30s-horizontal.mp4'))


def _top_h(W, H, kicker, text, name):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    spaced(d, (0, 250), kicker, f_jost(500, 24), (200, 200, 200), 7, True, W)
    f = f_pre('ExtraBold', 60)
    d.text(((W - d.textlength(text, font=f)) / 2, 300), text, font=f, fill='white')
    p = os.path.join(TMP, name + '.png'); im.save(p); return p


if __name__ == '__main__':
    vertical()
    horizontal()
