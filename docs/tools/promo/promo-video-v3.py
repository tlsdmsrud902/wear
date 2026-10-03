# WEARPICK 홍보 영상 v3 : 쇼핑몰 톤앤매너(흑백 · 여백 · 세리프 이탤릭 + Jost 키커 + Pretendard)로 다시 짠 판
#   v2 의 빠른 컷 · 3초 훅은 그대로, 노랑 상자 · 흔들림 · 플래시를 빼고
#   단색 바탕 위 「글 칸 + 실제 화면 카드(창 · 휴대폰)」 편집 구성으로 글자가 화면(UI) 위에 얹히지 않게 했다.
#   1) 실제 화면 촬영 (한 번만) : node docs/tools/serve.js &  →  FONTS=<폴더> NODE_PATH=$(npm root -g) node docs/tools/promo/capture-v2.js
#   2) 영상 만들기              : FONTS=<폴더> python3 docs/tools/promo/promo-video-v3.py [v|h]
#   FONTS : npm pack pretendard@1.3.9 @fontsource/jost @fontsource/playfair-display 를 풀어 둔 폴더
#   결과 (video/promo/) : wearpick-v3-reels-15s(.mp4 | -silent.mp4) 1080×1920 · wearpick-v3-16x9-30s(.mp4 | -silent.mp4) 1920×1080
#   원본 프레임 읽기 · 카메라 · 이징 · 효과음 합성은 promo-video-v2.py 의 것을 그대로 쓴다.
#   ⚠ 관리자 주소(?edit=1)는 자막 · 화면 어디에도 넣지 않는다 (영업 비밀).
import os, sys, math, importlib.util
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('pv2', os.path.join(HERE, 'promo-video-v2.py'))
pv = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(pv)
Clip, camera, keyed, EASE, clamp, rounded_mask = pv.Clip, pv.camera, pv.keyed, pv.EASE, pv.clamp, pv.rounded_mask
OUT, FONTS, FPS, BEAT = pv.OUT, pv.FONTS, pv.FPS, pv.BEAT

# ---------- 쇼핑몰 색 (st-*.css : #111 · #242424 · #ededed · #f5f5f5 · #fff) ----------
INK, INK2 = (17, 17, 17), (36, 36, 36)
PAPER, PAPER2, WHITE = (245, 245, 245), (237, 237, 237), (255, 255, 255)
LINE = (224, 224, 224)
MUTE_L, MUTE_D = (128, 128, 128), (160, 160, 160)   # 밝은 바탕 / 어두운 바탕 위 작은 글

PRE = FONTS + '/pretendard-1.3.9/dist/public/static/Pretendard-{}.otf'
JOST = FONTS + '/fontsource-jost-5.3.0/files/jost-latin-{}-normal.woff2'
PLAY = FONTS + '/fontsource-playfair-display-5.3.0/files/playfair-display-latin-{}-italic.woff2'
_fc = {}
def F(kind, w, s):
    k = (kind, w, int(s))
    if k not in _fc:
        _fc[k] = ImageFont.truetype({'pre': PRE, 'jost': JOST, 'serif': PLAY}[kind].format(w), int(s))
    return _fc[k]

def expo(k): return EASE['expo'](clamp(k))


# 원본 프레임 : 구간(약 3초)씩 풀어 원본마다 최근 4구간을 기억한다 (같은 원본을 여러 컷 · 장면 전환에서 함께 쓰므로)
_seg = {}
def frame_at(src, t):
    c = Clip.get(src)
    t = clamp(t, 0, c.dur - .04)
    segs = _seg.setdefault(src, [])
    for s in segs:
        if s[0] <= t <= s[1] - .05:
            segs.remove(s); segs.insert(0, s); break
    else:
        c.t0 = None; c.load(max(0, t - .3), min(c.dur, t + 2.7))
        s = (c.t0, c.t1, c.frames); segs.insert(0, s); del segs[4:]
    t0, t1, fr = s
    x = (t - t0) * c.fps; i = int(math.floor(x)); f = x - i
    i = max(0, min(len(fr) - 1, i)); j = min(len(fr) - 1, i + 1)
    if f < .08 or i == j: return fr[i]
    if f > .92: return fr[j]
    return (fr[i] * (1 - f) + fr[j] * f).astype(np.uint8)
def dark(bg): return sum(bg) < 300


# ======================================================================================
#  글자 : 줄 단위로 아래에서 올라오는 마스크 등장 (easeOutExpo) · 강조 = 반전 상자 / 밑줄이 그어진다
# ======================================================================================
# 줄 종류 : (글꼴, 굵기, 크기 배율, 자간 em, 대문자)
KIND = {
    'k': ('jost', 500, .30, .28, True),     # 키커 : FOR CAFE24 FASHION STORES
    's': ('serif', 500, .78, 0, False),     # 세리프 이탤릭 영문 : Lucky coupon
    'h': ('pre', 'Bold', 1.0, -.02, False),     # 한글 제목
    'hs': ('pre', 'SemiBold', .62, -.01, False),  # 한글 부제
    'sub': ('pre', 'Medium', .40, 0, False),      # 작은 설명
}

_lc = {}
def line_img(runs, kind, size, on_dark):
    """runs : [(글, 표시)] 표시 = None | 'inv' | 'ul'  → (기본 글 RGBA, 반전 글 RGBA, 표시 칸 [(종류, x0, x1)], 줄 높이, 기준선)"""
    key = (tuple(runs), kind, size, on_dark)
    if key in _lc: return _lc[key]
    fam, w, mul, track, up = KIND[kind]
    f = F(fam, w, size * mul)
    asc, desc = f.getmetrics()
    padx = int(f.size * .22)
    col = (WHITE if on_dark else INK) if kind in ('h', 's', 'hs') else ((MUTE_D if on_dark else MUTE_L) if kind == 'k' else ((200, 200, 200) if on_dark else (90, 90, 90)))
    inv_col = INK if on_dark else WHITE
    d0 = ImageDraw.Draw(Image.new('L', (4, 4)))
    tr = track * f.size
    def width(t): return sum(d0.textlength(c, font=f) for c in t) + tr * max(0, len(t) - 1) if tr else d0.textlength(t, font=f)
    # 반전 상자는 양옆 여백만큼 자리를 더 잡는다
    xs, x = [], 0
    for t, m in runs:
        t2 = t.upper() if up else t
        if m == 'inv': x += padx
        w_ = width(t2); xs.append((t2, m, x, x + w_)); x += w_ + (padx if m == 'inv' else 0)
    W = int(x + padx + 4); H = int((asc + desc) * 1.12) + 8
    base = int(asc * 1.06) + 4
    a = Image.new('RGBA', (W, H), (0, 0, 0, 0)); b = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    da, db = ImageDraw.Draw(a), ImageDraw.Draw(b)
    marks = []
    for t2, m, x0, x1 in xs:
        def put(dr, fill):
            if tr:
                xx = x0
                for c in t2: dr.text((xx, base), c, font=f, fill=fill, anchor='ls'); xx += dr.textlength(c, font=f) + tr
            else: dr.text((x0, base), t2, font=f, fill=fill, anchor='ls')
        put(da, col)
        if m:
            put(db, inv_col)
            if m == 'inv': marks.append(('inv', x0 - padx, x1 + padx))
            else: marks.append(('ul', x0, x1))
    out = (a, b, marks, H, base, f.size)
    _lc[key] = out
    return out


class Block:
    """글 묶음. lines : [(종류, [(글, 표시)])]. t_in / t_out : 구간 안 시각(초). xy : 왼쪽 위(align='l') 또는 가운데 위(align='c')"""
    def __init__(self, t_in, t_out, lines, xy, size, align='l', stagger=.07, gap=None, vcenter=False):
        self.t_in, self.t_out, self.lines, self.xy, self.size, self.align = t_in, t_out, lines, xy, size, align
        self.stagger, self.vcenter = stagger, vcenter
        self.gap = gap if gap is not None else int(size * .16)

    def draw(self, c, tl, bg):
        if tl < self.t_in - .01 or tl > self.t_out + .3: return []
        on_dark = dark(bg)
        imgs = [line_img(r, k, self.size, on_dark) for k, r in self.lines]
        total = sum(i[3] for i in imgs) + self.gap * (len(imgs) - 1)
        x0, y = self.xy
        if self.vcenter: y = y - total / 2
        events = []
        for n, (a, b, marks, H, base, fs) in enumerate(imgs):
            kind = self.lines[n][0]
            ti = self.t_in + n * self.stagger
            k_in = expo((tl - ti) / .55)
            k_out = EASE['in'](clamp((tl - self.t_out - n * .03) / .22))
            x = x0 if self.align == 'l' else x0 - a.width / 2
            if k_in > 0 and k_out < 1:
                dy = (1 - k_in) * H * 1.05 - k_out * H * 1.05   # 들어올 땐 아래에서 위로, 나갈 땐 위로 빠진다
                self._clip_paste(c, a, int(x), int(y), int(dy), H)
                for (m, mx0, mx1) in marks:
                    km = expo((tl - ti - .28) / .5)
                    if km <= 0: continue
                    if m == 'inv':
                        x1 = mx0 + (mx1 - mx0) * km
                        top, bot = y + base - fs * .98, y + base + fs * .28
                        box = (int(x + mx0), int(top + dy), int(x + x1), int(bot + dy))
                        if box[2] > box[0]:
                            # 상자를 줄 칸 안에서만 그린다
                            cy0, cy1 = max(box[1], int(y)), min(box[3], int(y + H))
                            if cy1 > cy0:
                                ImageDraw.Draw(c).rectangle((box[0], cy0, box[2], cy1), fill=(WHITE if on_dark else INK) + (255,))
                                inv = b.crop((int(mx0), 0, int(x1), H))
                                self._clip_paste(c, inv, int(x + mx0), int(y), int(dy), H)
                    else:
                        yy = int(y + base + fs * .2 + dy)
                        if y <= yy <= y + H:
                            ImageDraw.Draw(c).rectangle((int(x + mx0), yy, int(x + mx0 + (mx1 - mx0) * km), yy + max(3, fs // 28)), fill=(WHITE if on_dark else INK) + (255,))
            y += H + self.gap
        return events

    @staticmethod
    def _clip_paste(c, im, x, y, dy, H):
        # im 을 (x, y+dy) 에 두되 줄 칸 [y, y+H) 밖은 잘라 낸다
        top = max(0, -dy); bot = min(im.height, H - dy)
        if bot <= top: return
        c.alpha_composite(im.crop((0, top, im.width, bot)), (x, y + dy + top))


# ======================================================================================
#  실제 화면 카드 : 카드(둥근 모서리 + 1px 선) · 창(회색 점 세 개, 빈 주소 막대) · 휴대폰
# ======================================================================================
_shadow = {}
def shadow(size, r, on_dark):
    k = (size, r, on_dark)
    if k not in _shadow:
        w, h = size; pad = 60
        a = Image.new('L', (w + pad * 2, h + pad * 2), 0)
        ImageDraw.Draw(a).rounded_rectangle((pad, pad + 14, pad + w, pad + h + 14), r, fill=60 if not on_dark else 0)
        im = Image.new('RGBA', a.size, (0, 0, 0, 0)); im.putalpha(a.filter(ImageFilter.GaussianBlur(28)))
        _shadow[k] = im
    return _shadow[k]

_mask = {}
def rmask(w, h, r):
    k = (w, h, r)
    if k not in _mask: _mask[k] = rounded_mask(w, h, r)
    return _mask[k]

def draw_screen(c, arr, rect, style, cam, bg, scale=1.0):
    x, y, w, h = [int(v) for v in rect]
    on_dark = dark(bg)
    z, cx, cy = cam
    if style == 'window':
        bar = max(26, int(w * .03))
        scr = camera(arr, w, h - bar, z * scale, cx, cy).convert('RGBA')
        fr = Image.new('RGBA', (w, h), (232, 232, 232, 255))
        d = ImageDraw.Draw(fr)
        for i in range(3):
            r = bar * .17; xx = bar * .75 + i * bar * .55
            d.ellipse((xx - r, bar / 2 - r, xx + r, bar / 2 + r), fill=(190, 190, 190))
        d.rounded_rectangle((w * .32, bar * .24, w * .68, bar * .76), int(bar * .26), fill=(248, 248, 248))
        fr.paste(scr, (0, bar))
        r = int(bar * .45)
    elif style == 'phone':
        b = int(w * .035)
        scr = camera(arr, w - 2 * b, h - 2 * b, z * scale, cx, cy).convert('RGBA')
        fr = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(fr).rounded_rectangle((0, 0, w - 1, h - 1), int(w * .12), fill=INK + (255,))
        fr.paste(scr, (b, b), rmask(w - 2 * b, h - 2 * b, int(w * .09)))
        r = int(w * .12)
    else:   # card
        scr = camera(arr, w, h, z * scale, cx, cy).convert('RGBA')
        fr = scr; r = int(min(w, h) * .035) + 6
    c.alpha_composite(shadow((w, h), r, on_dark), (x - 60, y - 60))
    m = rmask(w, h, r)
    c.paste(fr, (x, y), m)
    if style == 'card' and not on_dark:   # 1px 선
        ImageDraw.Draw(c).rounded_rectangle((x, y, x + w - 1, y + h - 1), r, outline=LINE + (255,), width=2)


class Cut:
    """구간 안의 한 컷 : 실제 화면 하나를 rect 자리에 보여 준다"""
    def __init__(self, t0, t1, src, t, cam, rect, style='card', bump=None):
        self.t0, self.t1, self.src, self.t, self.cam, self.rect, self.style, self.bump = t0, t1, src, t, cam, rect, style, bump
    def needs(self): return [(self.src, self.t)]
    def draw(self, c, tl, bg):
        u = clamp((tl - self.t0) / (self.t1 - self.t0))
        sc = 1.0
        if self.bump:   # 50% 공개 : 아주 살짝 커졌다 자리 잡는다
            k = clamp((tl - self.t0 - self.bump) / .5)
            sc = 1 + .045 * math.sin(math.pi * min(1, k)) * (1 - k * .4) if k > 0 else 1
        draw_screen(c, frame_at(self.src, keyed(self.t, u)), self.rect, self.style, keyed(self.cam, u), bg, sc)


class Devices:
    """반응형 : PC 창 + 휴대폰을 한 화면에"""
    def __init__(self, t0, t1, pc, pc_t, ph, ph_t, win_rect, ph_rect, pc_cam=None, ph_cam=None):
        self.t0, self.t1, self.pc, self.pc_t, self.ph, self.ph_t = t0, t1, pc, pc_t, ph, ph_t
        self.win_rect, self.ph_rect = win_rect, ph_rect
        self.pc_cam = pc_cam or [(0, (1, .5, .5)), (1, (1, .5, .5))]; self.ph_cam = ph_cam or [(0, (1, .5, .5)), (1, (1, .5, .5))]
    def needs(self): return [(self.pc, self.pc_t), (self.ph, self.ph_t)]
    def draw(self, c, tl, bg):
        u = clamp((tl - self.t0) / (self.t1 - self.t0))
        k = expo((tl - self.t0) / .5)
        x, y, w, h = self.win_rect
        draw_screen(c, frame_at(self.pc, keyed(self.pc_t, u)), (x, y + 40 * (1 - k), w, h), 'window', keyed(self.pc_cam, u), PAPER)
        x, y, w, h = self.ph_rect
        draw_screen(c, frame_at(self.ph, keyed(self.ph_t, u)), (x + 120 * (1 - k), y, w, h), 'phone', keyed(self.ph_cam, u), PAPER)


class Section:
    def __init__(self, dur, bg, cuts, blocks, push=None, extra=None):
        self.dur, self.bg, self.cuts, self.blocks, self.push, self.extra = dur, bg, cuts, blocks, push, extra

    def prepare(self): pass   # 프레임은 frame_at 이 필요할 때 푼다

    def frame(self, W, H, tl):
        c = Image.new('RGBA', (W, H), self.bg + (255,))
        for cut in self.cuts:
            if cut.t0 <= tl < cut.t1 or (cut is self.cuts[-1] and tl >= cut.t1) or (cut is self.cuts[0] and tl < cut.t0):
                cut.draw(c, tl, self.bg); break
        if self.extra: self.extra(c, tl)
        for b in self.blocks: b.draw(c, tl, self.bg)
        return c


class Film:
    def __init__(self, W, H):
        self.W, self.H, self.secs, self.t = W, H, [], 0.0
        self.sfx = []
    def add(self, sec):
        sec.start = self.t; self.secs.append(sec); self.t += sec.dur
        if sec.push and len(self.secs) > 1: self.sfx.append(('whoosh', sec.start - .12, .28))
        return sec
    def sec_at(self, T):
        for s in self.secs:
            if s.start <= T < s.start + s.dur: return s
        return self.secs[-1]
    def frame(self, T):
        s = self.sec_at(T); i = self.secs.index(s)
        tl = T - s.start
        cur = s.frame(self.W, self.H, tl)
        PD = .42
        if s.push and i > 0 and tl < PD:
            prev = self.secs[i - 1]
            old = prev.frame(self.W, self.H, prev.dur + tl)
            k = expo(tl / PD)
            W, H = self.W, self.H
            out = Image.new('RGBA', (W, H))
            if s.push == 'up':
                out.paste(old, (0, int(-H * k))); out.paste(cur, (0, int(H * (1 - k))))
            else:
                out.paste(old, (int(-W * k), 0)); out.paste(cur, (int(W * (1 - k)), 0))
            cur = out
        return cur.convert('RGB')
    def render(self, path):
        import subprocess
        n = int(round(self.t * FPS))
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{self.W}x{self.H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', path], stdin=subprocess.PIPE)
        done = set()
        for i in range(n):
            T = i / FPS
            s = self.sec_at(T); j = self.secs.index(s)
            for x in (s, self.secs[j - 1] if j else s):
                if id(x) not in done: x.prepare(); done.add(id(x))
            p.stdin.write(self.frame(T).tobytes())
            if i % 90 == 0: print(f'  {T:5.1f}s / {self.t:.1f}s', flush=True)
        p.stdin.close(); p.wait()


# ======================================================================================
#  마지막 장면 (검정 바탕) : 키커 → WEARPICK → 세리프 한 줄 → 가는 선 → 정가(줄) → 런칭가(반전) → 검색창 → 크몽
# ======================================================================================
def cta_extra(layout):
    v = layout == 'v'
    G = dict(kick=330, logo=395, logo_s=150, serif=585, rule=700, old=760, new=840, new_s=96, lab=1020, bar=1085, bw=760, bh=112, kmong=1290) if v else \
        dict(kick=120, logo=170, logo_s=150, serif=345, rule=448, old=490, new=556, new_s=88, lab=712, bar=768, bw=700, bh=96, kmong=930)
    def extra(c, tl):
        W, H = c.size; cx = W / 2; d = ImageDraw.Draw(c)
        def fade_text(t0, y, s, f, fill, track=0):
            k = expo((tl - t0) / .6)
            if k <= 0: return 0
            w = sum(d.textlength(ch, font=f) for ch in s) + track * (len(s) - 1) if track else d.textlength(s, font=f)
            yy = y + (1 - k) * 26; a = int(255 * clamp(k * 1.6))
            if track:
                x = cx - w / 2
                for ch in s: d.text((x, yy), ch, font=f, fill=fill + (a,)); x += d.textlength(ch, font=f) + track
            else: d.text((cx - w / 2, yy), s, font=f, fill=fill + (a,))
            return w
        fade_text(.05, G['kick'], 'A CAFE24 SHOP SKIN', F('jost', 500, 30 if v else 28), MUTE_D, 30 * .3)
        # 로고 : 글자 사이가 넓게 벌어지며 자리 잡는다
        k = expo((tl - .1) / .9); fl = F('jost', 500, G['logo_s'])
        tr = G['logo_s'] * (.08 + .12 * k)
        s = 'WEARPICK'; w = sum(d.textlength(ch, font=fl) for ch in s) + tr * 7
        x = cx - w / 2
        for ch in s: d.text((x, G['logo']), ch, font=fl, fill=WHITE + (int(255 * clamp(k * 1.5)),)); x += d.textlength(ch, font=fl) + tr
        fade_text(.35, G['serif'], 'Good wear. Good day.', F('serif', 400, 62 if v else 54), (205, 205, 205))
        kr = expo((tl - .5) / .6)
        if kr > 0: d.rectangle((cx - 70 * kr, G['rule'], cx + 70 * kr, G['rule'] + 1), fill=(120, 120, 120, 255))
        fo = F('pre', 'Medium', 46 if v else 40)
        w = fade_text(.62, G['old'], '정가 250,000원', fo, (140, 140, 140))
        ks = expo((tl - .9) / .45)
        if w and ks > 0:
            yl = G['old'] + fo.size * .62
            d.rectangle((cx - w / 2 - 6, yl, cx - w / 2 - 6 + (w + 12) * ks, yl + 3), fill=(200, 200, 200, 255))
        # 런칭가 220,000원 : 숫자 칸이 흰 상자로 반전된다
        if tl > .85:
            b = Block(.85, 1e9, [('h', [('런칭가 ', None), ('220,000원', 'inv')])], (cx, G['new']), G['new_s'], align='c')
            b.draw(c, tl, INK)
        fl2 = F('pre', 'Medium', 40 if v else 34)
        fade_text(1.25, G['lab'], '카페24 디자인센터에서 검색', fl2, (200, 200, 200))
        kb = expo((tl - 1.35) / .6)
        if kb > 0:
            bw, bh, ys = G['bw'], G['bh'], G['bar']
            x0 = cx - bw / 2; w2 = bw * (.4 + .6 * kb)
            d.rounded_rectangle((cx - w2 / 2, ys, cx + w2 / 2, ys + bh), bh // 2, fill=WHITE + (int(255 * clamp(kb * 2)),))
            n = int(clamp((tl - 1.7) / .5) * 8); q = 'WEARPICK'[:n]
            fq = F('jost', 500, int(bh * .42))
            tx = x0 + bh * .5
            d.text((tx, ys + bh / 2), q, font=fq, fill=INK, anchor='lm')
            if kb > .95 and (n < 8 or int(tl * 2.5) % 2 == 0):
                qx = tx + d.textlength(q, font=fq) + 5
                d.rectangle((qx, ys + bh * .28, qx + 2, ys + bh * .72), fill=INK + (255,))
            if kb > .95:
                r = bh * .17; mx, my = x0 + bw - bh * .6, ys + bh / 2 - 3
                d.ellipse((mx - r, my - r, mx + r, my + r), outline=INK, width=4)
                d.line((mx + r * .72, my + r * .72, mx + r * 1.55, my + r * 1.55), fill=INK, width=5)
        fade_text(2.1, G['kmong'], '크몽에서도 구매 가능', F('pre', 'Regular', 34 if v else 30), (150, 150, 150))
    return extra


# ======================================================================================
#  세로 15초 : 위쪽 = 글 칸(단색 바탕), 아래쪽 = 실제 화면 카드
# ======================================================================================
def vertical():
    W, H = 1080, 1920
    fm = Film(W, H)
    M = 'cap-m-'
    CARD = (90, 760, 900, 760)          # 실제 화면 카드 자리
    TX, TY, SZ = 90, 255, 90            # 글 칸 (왼쪽 위) · 제목 크기
    B = lambda t0, t1, lines, **k: Block(t0, t1, lines, (TX, TY), SZ, **k)
    C = lambda t0, t1, src, t, cam, **k: Cut(t0, t1, src, t, cam, k.pop('rect', CARD), **k)

    # 0 ~ 3초 : 훅 (사장님 부르기 → 한 줄 요약 → 50% 공개)
    fm.add(Section(3.0, PAPER, [
        C(0, .5, M + 'coupon', [(0, 1.55), (1, 2.6, 'lin')], [(0, (1.32, .5, .53)), (1, (1.24, .5, .53), 'out')]),
        C(.5, 1.0, M + 'coupon', [(0, 2.6), (1, 3.95, 'lin')], [(0, (1.24, .5, .53)), (1, (1.3, .5, .53), 'out')]),
        C(1.0, 1.5, M + 'coupon', [(0, 4.47), (1, 4.97, 'lin')], [(0, (1.3, .5, .5)), (1, (1.34, .5, .5), 'lin')]),
        C(1.5, 2.3, M + 'coupon', [(0, 4.97), (1, 5.5, 'lin')], [(0, (1.36, .5, .5)), (1, (1.6, .5, .5), 'io')]),
        C(2.3, 3.0, M + 'coupon', [(0, 5.51), (.3, 5.62, 'lin'), (1, 6.4, 'lin')], [(0, (1.5, .5, .5)), (1, (1.42, .5, .5), 'out')], bump=0),
    ], [
        B(-.35, 1.32, [('k', [('For Cafe24 fashion stores', None)]), ('h', [('카페24 의류몰', None)]), ('h', [('사장님', 'inv')])]),
        B(1.5, 2.15, [('k', [('One skin, everything', None)]), ('h', [('쿠폰 · 타임세일 · 편집', None)]), ('h', [('스킨 하나로', 'ul')])], stagger=.05),
        B(2.3, 3.2, [('s', [('Lucky coupon', None)]), ('h', [('고객이 직접 뽑는', None)]), ('h', [('랜덤 쿠폰 ', None), ('5~50%', 'inv')])], stagger=.05),
    ]))
    # 3 ~ 5초 : 마감 카운트다운 · 세일 페이지 (검정 바탕)
    fm.add(Section(2.0, INK, [
        C(0, .75, M + 'sale', [(0, .3), (1, 1.35, 'lin')], [(0, (1.0, .5, .3)), (1, (1.1, .5, .26), 'out')]),
        C(.75, 1.4, M + 'sale', [(0, 1.35), (1, 2.35, 'lin')], [(0, (1.1, .5, .5)), (1, (1.02, .5, .5), 'out')]),
        C(1.4, 2.0, M + 'sale', [(0, 5.9), (1, 7.9, 'io')], [(0, (1.0, .5, .5)), (1, (1.08, .5, .5))]),
    ], [
        B(.15, 1.15, [('k', [('Time sale', None)]), ('h', [('이벤트 마감까지', None)]), ('h', [('카운트다운', 'inv')])], stagger=.05),
        B(1.3, 2.2, [('k', [('Sale page', None)]), ('h', [('세일 페이지도', None)]), ('h', [('그대로 완성', 'ul')])], stagger=.05),
    ], push='up'))
    # 5 ~ 9.6초 : 코딩 없이 클릭으로 수정 (흰 바탕)
    fm.add(Section(4.6, WHITE, [
        C(0, .8, M + 'edit', [(0, .6), (1, 1.75, 'lin')], [(0, (1.0, .5, .4)), (1, (1.42, .3, .33), 'io')]),
        C(.8, 1.3, M + 'editor', [(0, .15), (1, .8, 'lin')], [(0, (1.15, .5, .22)), (1, (1.08, .5, .23), 'out')]),
        C(1.3, 2.55, M + 'editor', [(0, 2.5), (.15, 2.75, 'lin'), (1, 4.62, 'lin')], [(0, (1.12, .5, .43)), (1, (1.3, .48, .43), 'out')]),
        C(2.55, 3.05, M + 'editor', [(0, 5.55), (1, 6.2, 'lin')], [(0, (1.45, .5, .37)), (1, (1.3, .5, .37), 'out')]),
        C(3.05, 4.6, M + 'after', [(0, 1.12), (1, 3.4, 'lin')], [(0, (1.0, .5, .64)), (1, (1.3, .32, .7), 'io')]),
    ], [
        B(.12, 1.25, [('s', [('No code.', None)]), ('h', [('코딩 없이', 'inv')]), ('h', [('클릭으로 수정', None)])], stagger=.05),
        B(1.4, 3.0, [('k', [('Click · Type · Save', None)]), ('h', [('글자만 바꾸고', None)]), ('h', [('저장', 'inv')])], stagger=.05),
        B(3.1, 4.8, [('k', [('Instantly', None)]), ('h', [('새로고침하면', None)]), ('h', [('바로 반영', 'ul')])], stagger=.05),
    ], push='left'))
    # 9.6 ~ 12초 : 반응형 (연회색 바탕)
    fm.add(Section(2.4, PAPER2, [
        Devices(0, 1.3, 'cap-p-home', [(0, 1.0), (1, 2.6, 'lin')], M + 'home', [(0, 1.0), (1, 2.6, 'lin')], (60, 760, 960, 574), (690, 900, 330, 600)),
        C(1.3, 2.4, M + 'home', [(0, 2.75), (1, 7.4, 'io')], [(0, (1.0, .5, .45)), (1, (1.05, .5, .5))]),
    ], [
        B(.12, 1.25, [('k', [('Responsive', None)]), ('h', [('PC · 모바일', None)]), ('h', [('자동 반응형', 'inv')])], stagger=.05),
        B(1.38, 2.6, [('s', [('Made for fashion', None)]), ('h', [('여성 의류몰', None)]), ('h', [('전용 디자인', 'ul')])], stagger=.05),
    ], push='up'))
    # 12 ~ 15초 : 마지막 장면
    fm.add(Section(3.0, INK, [], [], push='left', extra=cta_extra('v')))

    ev = [('tap', 1.21, .55), ('tap', 5.53, .55), ('tap', 7.65, .6), ('chime', 2.3, .8), ('chime', 12.95, .5)]
    ev += [('key', 6.47 + i * .08, .35) for i in range(13)]
    ev += [('key', 13.7 + i * .062, .3) for i in range(8)]
    ev += fm.sfx
    return fm, ev


# ======================================================================================
#  가로 30초 : 왼쪽 = 글 칸, 오른쪽 = 실제 화면(창 · 휴대폰)
# ======================================================================================
def horizontal():
    W, H = 1920, 1080
    fm = Film(W, H)
    P, M = 'cap-p-', 'cap-m-'
    WIN = (750, 200, 1120, 665)        # 1120 × (630 + 막대 35)
    TALL = (790, 90, 1040, 900)        # 편집 창(세로로 긴 화면)
    TX, SZ = 100, 72
    B = lambda t0, t1, lines, **k: Block(t0, t1, lines, (TX, 540), SZ, vcenter=True, **k)
    C = lambda t0, t1, src, t, cam, **k: Cut(t0, t1, src, t, cam, k.pop('rect', WIN), k.pop('style', 'window'), **k)

    fm.add(Section(4.0, PAPER, [
        C(0, .6, P + 'coupon', [(0, 1.5), (1, 2.6, 'lin')], [(0, (1.25, .5, .5)), (1, (1.12, .5, .5), 'out')]),
        C(.6, 1.2, P + 'coupon', [(0, 2.6), (1, 3.9, 'lin')], [(0, (1.0, .5, .5)), (1, (1.08, .5, .5), 'out')]),
        C(1.2, 1.7, P + 'coupon', [(0, 4.95), (1, 5.6, 'lin')], [(0, (1.3, .5, .5)), (1, (1.34, .5, .5), 'lin')]),
        C(1.7, 2.4, P + 'coupon', [(0, 5.6), (1, 6.2, 'lin')], [(0, (1.36, .5, .5)), (1, (1.6, .5, .45), 'io')]),
        C(2.4, 4.0, P + 'coupon', [(0, 6.21), (.15, 6.3, 'lin'), (1, 7.6, 'lin')], [(0, (1.55, .5, .43)), (1, (1.42, .5, .45), 'out')], bump=0),
    ], [
        B(-.35, 1.38, [('k', [('For Cafe24 fashion stores', None)]), ('h', [('카페24 의류몰', None)]), ('h', [('사장님', 'inv')])]),
        B(1.5, 2.25, [('k', [('One skin, everything', None)]), ('h', [('쿠폰 · 타임세일', None)]), ('h', [('클릭 편집까지', None)]), ('h', [('스킨 하나로', 'ul')])], stagger=.05),
        B(2.4, 4.2, [('s', [('Lucky coupon', None)]), ('h', [('고객이 직접 뽑는', None)]), ('h', [('랜덤 쿠폰 ', None), ('5~50%', 'inv')])], stagger=.05),
    ]))
    fm.add(Section(3.5, WHITE, [
        C(0, 1.5, P + 'coupon', [(0, 7.4), (1, 9.1, 'lin')], [(0, (1.0, .5, .5)), (1, (1.1, .5, .47), 'io')]),
        Devices(1.5, 3.5, P + 'coupon', [(0, 5.3), (1, 7.6, 'lin')], M + 'coupon', [(0, 4.45), (1, 6.6, 'lin')], (800, 200, 960, 575), (1530, 330, 320, 580)),
    ], [
        B(.12, 1.4, [('k', [('01 · Random coupon', None)]), ('h', [('5%부터 50%까지', None)]), ('h', [('랜덤으로', 'ul')])], stagger=.05),
        B(1.55, 3.7, [('k', [('Members only', None)]), ('h', [('회원 1인 1회', None)]), ('h', [('뽑으면 바로', None)]), ('h', [('마이쿠폰 발급', 'inv')])], stagger=.05),
    ], push='left'))
    fm.add(Section(4.0, INK, [
        C(0, 1.25, P + 'sale', [(0, .2), (1, 1.6, 'lin')], [(0, (2.3, .54, .08)), (1, (2.05, .54, .08), 'out')]),
        C(1.25, 2.5, P + 'sale', [(0, 1.6), (1, 3.4, 'lin')], [(0, (1.12, .4, .45)), (1, (1.02, .5, .5), 'out')]),
        C(2.5, 4.0, P + 'sale', [(0, 4.0), (1, 7.7, 'io')], [(0, (1.0, .5, .5)), (1, (1.06, .5, .5))]),
    ], [
        B(.12, 1.95, [('k', [('02 · Time sale', None)]), ('h', [('이벤트 마감까지', None)]), ('h', [('카운트다운', 'inv')])], stagger=.05),
        B(2.1, 4.2, [('k', [('Sale page', None)]), ('h', [('세일 페이지도', None)]), ('h', [('그대로 완성', 'ul')])], stagger=.05),
    ], push='up'))
    fm.add(Section(8.5, WHITE, [
        C(0, 1.5, P + 'edit', [(0, .4), (1, 2.6, 'lin')], [(0, (1.0, .5, .5)), (.45, (1.0, .5, .5)), (1, (2.1, .14, .12), 'io')]),
        C(1.5, 2.5, P + 'editor', [(0, .15), (1, 1.2, 'lin')], [(0, (1.0, .5, .32)), (1, (1.06, .5, .3), 'out')], rect=TALL),
        C(2.5, 5.0, P + 'editor', [(0, 2.0), (1, 5.45, 'lin')], [(0, (1.2, .45, .48)), (.2, (1.38, .42, .5)), (1, (1.45, .42, .5), 'lin')], rect=TALL),
        C(5.0, 6.0, P + 'editor', [(0, 6.65), (1, 7.65, 'lin')], [(0, (1.3, .7, .38)), (1, (1.5, .75, .4), 'out')], rect=TALL),
        C(6.0, 8.5, P + 'after', [(0, 1.25), (1, 3.4, 'lin')], [(0, (1.0, .5, .5)), (1, (1.3, .26, .42), 'io')]),
    ], [
        B(.12, 1.4, [('s', [('No code.', None)]), ('h', [('코딩 없이', 'inv')]), ('h', [('클릭으로 수정', None)])], stagger=.05),
        B(1.55, 2.95, [('k', [('03 · Click to edit', None)]), ('h', [('고치기를 누르면', None)]), ('h', [('편집 창이 열려요', None)])], stagger=.05),
        B(3.1, 4.95, [('k', [('Type', None)]), ('h', [('채워진 칸에', None)]), ('h', [('새 글만 쓰고', 'ul')])], stagger=.05),
        B(5.1, 6.0, [('k', [('Save', None)]), ('h', [('저장', 'inv')])], stagger=.05),
        B(6.1, 8.7, [('k', [('Instantly', None)]), ('h', [('새로고침하면', None)]), ('h', [('바로 반영', 'ul')])], stagger=.05),
    ], push='left'))
    fm.add(Section(4.0, PAPER2, [
        Devices(0, 2.0, P + 'home', [(0, .8), (1, 3.4, 'lin')], M + 'home', [(0, .8), (1, 3.4, 'lin')], (800, 200, 960, 575), (1530, 330, 320, 580)),
        C(2.0, 4.0, P + 'home', [(0, 3.4), (1, 10.5, 'io')], [(0, (1.0, .5, .5)), (1, (1.04, .5, .5))]),
    ], [
        B(.12, 1.9, [('k', [('04 · Responsive', None)]), ('h', [('PC · 모바일', None)]), ('h', [('자동 반응형', 'inv')])], stagger=.05),
        B(2.05, 4.2, [('s', [('Made for fashion', None)]), ('h', [('여성 의류몰에', None)]), ('h', [('딱 맞춘 디자인', 'ul')])], stagger=.05),
    ], push='up'))
    fm.add(Section(6.0, INK, [], [], push='left', extra=cta_extra('h')))

    ev = [('tap', 1.36, .55), ('chime', 2.4, .8), ('tap', 12.73, .5), ('tap', 17.4, .6), ('chime', 24.95, .5)]
    ev += [('key', 15.0 + i * .1, .32) for i in range(13)]
    ev += [('key', 25.7 + i * .062, .3) for i in range(8)]
    ev += fm.sfx
    return fm, ev


# ======================================================================================
#  소리 : 더 담백하게 — 부드러운 킥 · 가는 틱 · 낮은 베이스 · 차임 한 번
# ======================================================================================
SR = pv.SR
def s_soft_kick(g=1.0):
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t / .03)
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .13) * np.minimum(1, t / .004)

def s_tick(g=1.0):
    n = int(.05 * SR); t = np.arange(n) / SR
    return g * pv.band(pv.rng.standard_normal(n), 3000, 9000) * np.exp(-t / .006) * .35

def s_chime(g=1.0):
    n = int(1.8 * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1046.5, 1, .9), (1568, .45, .6), (2093, .25, .4), (523.25, .35, 1.0)))
    return g * x * np.minimum(1, t / .004) * .28

def s_pad(freqs, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t + 1) for f in freqs)
    e = np.minimum(1, t / .25) * np.minimum(1, (dur - t) / .3)
    return g * pv.band(x, 0, 2000) * e * .07

def mix(dur, events, path):
    n = int((dur + 2) * SR); music = np.zeros(n); fx = np.zeros(n)
    def put(buf, x, t):
        i = int(t * SR)
        if i < 0: x = x[-i:]; i = 0
        j = min(n, i + len(x)); buf[i:j] += x[:j - i]
    roots = [55.0, 43.65, 65.41, 49.0]
    chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 261.63, 329.63), (196.0, 246.94, 293.66)]
    b, t = 0, 0.0
    while t < dur - .2:
        bar = (b // 4) % 4
        put(music, s_soft_kick(.8 if b % 2 == 0 else .55), t)
        put(music, s_tick(.5), t + BEAT / 2)
        if b % 4 == 0:
            put(music, pv.s_bass(roots[bar], BEAT * 3.6, .35), t)
            put(music, s_pad(chords[bar], BEAT * 4, 1.0), t)
        b += 1; t += BEAT
    for name, t, g in events:
        x = {'tap': pv.s_tap, 'key': pv.s_key, 'whoosh': pv.s_whoosh, 'chime': s_chime}[name](g)
        put(fx, x, t)
    e = pv.lp_fast(np.abs(fx), 30, 1); duck = 1 - np.clip(e * 1.2, 0, .4)
    out = music * .6 * duck + fx * .75
    out = pv.band(np.tanh(out * 1.05) * .9, 30, 12000)[:int(dur * SR)]
    fade = int(.5 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    st = np.stack([out, out], 1); st = (st / max(1e-6, np.abs(st).max()) * .89 * 32767).astype(np.int16)
    import wave
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())


def build(which):
    fm, ev = vertical() if which == 'v' else horizontal()
    name = 'wearpick-v3-reels-15s' if which == 'v' else 'wearpick-v3-16x9-30s'
    tmpv = os.path.join(OUT, '.' + name + '-video.mp4'); wav = os.path.join(OUT, '.' + name + '.wav')
    print(name, f'{fm.t:.2f}s')
    if os.environ.get('ONLY') != 'audio': fm.render(tmpv)
    mix(fm.t, ev, wav)
    pv.finish(tmpv, wav, os.path.join(OUT, name + '.mp4'), os.path.join(OUT, name + '-silent.mp4'))
    if os.environ.get('KEEP') != '1':
        for f in (tmpv, wav): os.remove(f)


if __name__ == '__main__':
    for w in (sys.argv[1:] or ['v', 'h']): build(w)
