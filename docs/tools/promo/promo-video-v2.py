# WEARPICK 홍보 영상 v2 : 실제 스킨 화면(video/src/cap-*.mp4)을 빠른 컷 · 줌 · 속도 조절 · 움직이는 자막으로 엮는다
#   1) 실제 화면 촬영 (한 번만) : node docs/tools/serve.js &  →  FONTS=<폴더> NODE_PATH=$(npm root -g) node docs/tools/promo/capture-v2.js
#   2) 영상 만들기              : FONTS=<폴더> python3 docs/tools/promo/promo-video-v2.py [v|h]   (v = 세로 15초, h = 가로 30초, 생략 = 둘 다)
#   FONTS : npm pack pretendard@1.3.9 @fontsource/jost 를 풀어 둔 폴더
#   결과 (video/promo/)
#     wearpick-v2-reels-15s.mp4 / -silent.mp4   1080×1920 30fps  (Instagram Reels · Facebook 광고)
#     wearpick-v2-16x9-30s.mp4 / -silent.mp4    1920×1080 30fps  (크몽 · 카페24 디자인센터)
#   소리 : 음악은 받을 수 없어서 numpy 로 직접 만든 비트(120BPM) + 효과음(휙 · 탭 · 팝 · 쿵)을 넣는다. 컷은 박자(0.5초 / 0.25초)에 맞춘다.
#          -silent 는 광고 관리자에서 Meta 음악을 붙일 때 쓴다.
#   ⚠ 관리자 주소(?edit=1)는 자막 · 화면 어디에도 넣지 않는다 (영업 비밀). 촬영은 주소창 없는 headless 브라우저.
import os, sys, math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC = os.path.join(REPO, 'video', 'src')
OUT = os.path.join(REPO, 'video', 'promo')
FONTS = os.environ['FONTS']
FPS = 30
BEAT = 0.5          # 120 BPM
ACCENT = (255, 214, 0)   # 강조 한 가지 색 (노랑) — 나머지는 흑백
os.makedirs(OUT, exist_ok=True)

PRE = FONTS + '/pretendard-1.3.9/dist/public/static/Pretendard-{}.otf'
JOST = FONTS + '/fontsource-jost-5.3.0/files/jost-latin-{}-normal.woff2'
_fc = {}
def font(kind, w, s):
    k = (kind, w, s)
    if k not in _fc: _fc[k] = ImageFont.truetype((PRE if kind == 'pre' else JOST).format(w), s)
    return _fc[k]


# ======================================================================================
#  이징 · 보간
# ======================================================================================
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
EASE = {
    'lin': lambda k: k,
    'out': lambda k: 1 - (1 - k) ** 3,
    'in': lambda k: k ** 3,
    'io': lambda k: 4 * k ** 3 if k < .5 else 1 - (-2 * k + 2) ** 3 / 2,
    'expo': lambda k: 1 if k >= 1 else 1 - 2 ** (-10 * k),
    'back': lambda k: 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2,
}

def keyed(keys, u):
    """keys : [(u, 값 또는 튜플, 이징)] — u 는 0~1 (샷 안의 진행). 이징은 그 구간에 쓰인다"""
    if u <= keys[0][0]: return keys[0][1]
    for i in range(len(keys) - 1):
        u0, v0 = keys[i][0], keys[i][1]
        u1, v1 = keys[i + 1][0], keys[i + 1][1]
        e = keys[i + 1][2] if len(keys[i + 1]) > 2 else 'io'
        if u <= u1:
            k = EASE[e](clamp((u - u0) / max(u1 - u0, 1e-6)))
            if isinstance(v0, tuple): return tuple(a + (b - a) * k for a, b in zip(v0, v1))
            return v0 + (v1 - v0) * k
    return keys[-1][1]


# ======================================================================================
#  원본 영상 프레임 (필요한 구간만 풀어서 메모리에 둔다)
# ======================================================================================
class Clip:
    cache = {}

    def __init__(self, name):
        self.path = os.path.join(SRC, name + '.mp4')
        p = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                            '-show_entries', 'format=duration', '-of', 'default=nw=1', self.path], capture_output=True, text=True).stdout
        d = dict(l.split('=') for l in p.split())
        self.w, self.h = int(d['width']), int(d['height'])
        a, b = d['r_frame_rate'].split('/'); self.fps = int(a) / int(b)
        self.dur = float(d['duration'])
        self.t0 = self.t1 = None; self.frames = []

    @classmethod
    def get(cls, name):
        if name not in cls.cache: cls.cache[name] = Clip(name)
        return cls.cache[name]

    def load(self, a, b):
        a = max(0, a - 0.1); b = min(self.dur, b + 0.15)
        if self.t0 is not None and a >= self.t0 and b <= self.t1: return
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{a:.3f}', '-t', f'{b - a:.3f}', '-i', self.path,
                              '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
        n = len(raw) // (self.w * self.h * 3)
        self.frames = np.frombuffer(raw, np.uint8)[:n * self.w * self.h * 3].reshape(n, self.h, self.w, 3)
        self.t0, self.t1 = a, a + n / self.fps

    def at(self, t):
        """시각 t 의 화면 — 프레임 사이면 두 장을 섞는다 (느리게 돌릴 때 끊김이 덜하다)"""
        x = (t - self.t0) * self.fps
        i = int(math.floor(x)); f = x - i
        n = len(self.frames)
        i = max(0, min(n - 1, i)); j = min(n - 1, i + 1)
        if f < 0.08 or i == j: return self.frames[i]
        if f > 0.92: return self.frames[j]
        return (self.frames[i] * (1 - f) + self.frames[j] * f).astype(np.uint8)


def camera(arr, W, H, zoom=1.0, cx=0.5, cy=0.5, dx=0, dy=0, fit='cover', bg=(0, 0, 0)):
    """원본 배열 → W×H. zoom 1 = 꽉 채움(cover). cx, cy = 원본에서 화면 가운데에 올 점 (0~1). dx, dy = 흔들림(px)"""
    h, w = arr.shape[:2]
    s0 = max(W / w, H / h) if fit == 'cover' else min(W / w, H / h)
    s = s0 * zoom
    px, py = cx * w, cy * h
    if fit == 'cover':   # 가장자리가 비지 않게
        hw, hh = W / 2 / s, H / 2 / s
        px = clamp(px, hw, w - hw) if w > 2 * hw else w / 2
        py = clamp(py, hh, h - hh) if h > 2 * hh else h / 2
    im = Image.fromarray(arr)
    a = 1 / s
    return im.transform((W, H), Image.AFFINE, (a, 0, px - (W / 2 + dx) * a, 0, a, py - (H / 2 + dy) * a),
                        resample=Image.BILINEAR, fillcolor=bg)


def shake(t, amp, seed=0):
    if amp <= 0: return 0, 0
    return (amp * (math.sin(t * 71 + seed) * .6 + math.sin(t * 113 + seed * 3) * .4),
            amp * (math.sin(t * 89 + seed * 2) * .6 + math.sin(t * 131 + seed) * .4))


# ======================================================================================
#  샷 : 원본 구간 · 속도(키) · 카메라(키) · 흔들림
# ======================================================================================
class Shot:
    def __init__(self, dur, src=None, t=None, cam=None, shake=None, render=None, whip_in=None, flash=0, bg=(10, 10, 10), fit='cover', post=None):
        self.dur, self.src, self.t, self.cam = dur, src, t, cam or [(0, (1.0, .5, .5)), (1, (1.0, .5, .5))]
        self.shake, self.render, self.whip_in, self.flash, self.bg, self.fit, self.post = shake or [], render, whip_in, flash, bg, fit, post

    def prepare(self):
        if self.src:
            c = Clip.get(self.src); ts = [k[1] for k in self.t]; c.load(min(ts), max(ts))

    def src_time(self, u): return keyed(self.t, u)

    def frame(self, W, H, tl, T):
        """tl = 샷 안 시각(초), T = 전체 시각"""
        u = clamp(tl / self.dur)
        if self.render: im = self.render(W, H, u, tl, T)
        else:
            z, cx, cy = keyed(self.cam, u)
            amp = 0
            for (a, b, m) in self.shake:
                if a <= tl < b: amp = max(amp, m * (1 - (tl - a) / (b - a)) ** 1.5)
            dx, dy = shake(T, amp)
            im = camera(Clip.get(self.src).at(self.src_time(u)), W, H, z, cx, cy, dx, dy, self.fit, self.bg)
        if self.post: im = self.post(im, W, H, u, tl, T)
        return im


# ======================================================================================
#  움직이는 자막 : 단어마다 상자에 담아 톡톡 튀어나오게
# ======================================================================================
_wc = {}
def word_img(text, style, size):
    k = (text, style, size)
    if k in _wc: return _wc[k]
    f = font('pre', 'Black', size)
    d0 = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
    l, t, r, b = d0.textbbox((0, 0), text, font=f)
    px, py = int(size * .2), int(size * .13)
    asc, desc = f.getmetrics()
    w, h = int(r - l + px * 2), int(asc + desc * .35 + py * 2)
    im = Image.new('RGBA', (w + 16, h + 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if style == 'plain':   # 상자 없이 흰 글자 + 그림자
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((8 + px - l, 8 + py + 3), text, font=f, fill=(0, 0, 0, 200))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
        d.text((8 + px - l, 8 + py), text, font=f, fill='white')
    else:
        bgc, fg = {'w': ((12, 12, 12, 240), (255, 255, 255)), 'y': (ACCENT + (255,), (10, 10, 10)), 'white': ((255, 255, 255, 250), (10, 10, 10))}[style]
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((8, 12, 8 + w, 12 + h), int(size * .12), fill=(0, 0, 0, 110))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)))
        d.rounded_rectangle((8, 8, 8 + w, 8 + h), int(size * .12), fill=bgc)
        d.text((8 + px - l, 8 + py - 2), text, font=f, fill=fg)
    _wc[k] = im
    return im


class Caption:
    """lines : [[(단어, 스타일)], …] / t_in, t_out : 전체 시각 / at : 화면에서 글 묶음의 가운데 (x, y) / align : center|left
       단어는 t_in 부터 stagger 간격으로 하나씩 튀어나온다. times 를 주면 단어별 시각을 직접 정한다."""
    def __init__(self, t_in, t_out, lines, at, size=96, stagger=0.12, anim='pop', align='center', times=None, gap=None, out='cut'):
        self.t_in, self.t_out, self.lines, self.at, self.size = t_in, t_out, lines, at, size
        self.stagger, self.anim, self.align, self.times, self.out = stagger, anim, align, times, out
        self.gap = gap if gap is not None else int(size * .14)
        self.pops = []   # 효과음용 (단어가 나오는 시각)
        n = 0
        for li in lines:
            for _ in li:
                self.pops.append(times[n] if times else t_in + n * stagger); n += 1

    def draw(self, canvas, T):
        if T < self.t_in or T >= self.t_out: return
        imgs = [[word_img(w, s, self.size) for w, s in li] for li in self.lines]
        lh = [max(i.height for i in row) - 16 for row in imgs]
        lw = [sum(i.width - 16 for i in row) + self.gap * (len(row) - 1) for row in imgs]
        total = sum(lh) + int(self.size * .12) * (len(lh) - 1)
        x0, y = self.at[0], self.at[1] - total / 2
        k_out = 1.0
        if self.out == 'fade' and T > self.t_out - 0.12: k_out = clamp((self.t_out - T) / 0.12)
        n = 0
        for r, row in enumerate(imgs):
            x = x0 - lw[r] / 2 if self.align == 'center' else x0
            for im in row:
                ti = self.pops[n]; n += 1
                k = clamp((T - ti) / 0.2)
                if k <= 0: x += im.width - 16 + self.gap; continue
                if self.anim == 'pop':
                    sc = 0.55 + 0.45 * EASE['back'](k); alpha = clamp(k * 3); oy = 0
                elif self.anim == 'slide':
                    sc = 1; alpha = clamp(k * 2.5); oy = (1 - EASE['out'](k)) * self.size * .6
                else:
                    sc = 1; alpha = 1; oy = 0
                alpha *= k_out
                w2, h2 = max(1, int(im.width * sc)), max(1, int(im.height * sc))
                im2 = im.resize((w2, h2), Image.BILINEAR) if sc != 1 else im
                if alpha < 1:
                    a = np.array(im2); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); im2 = Image.fromarray(a)
                cx = x + (im.width - 16) / 2; cy = y + lh[r] / 2
                canvas.alpha_composite(im2, (int(cx - w2 / 2), int(cy - h2 / 2 + oy)))
                x += im.width - 16 + self.gap
            y += lh[r] + int(self.size * .12)


# ======================================================================================
#  타임라인 → 영상
# ======================================================================================
class Timeline:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.shots, self.caps, self.flashes, self.overlays, self.sfx = [], [], [], [], []
        self.t = 0.0

    def add(self, shot, whip=None, flash=0.0):
        shot.start = self.t; shot.whip_in = whip; self.shots.append(shot)
        if flash: self.flashes.append((self.t, flash))
        if whip: self.sfx.append(('whoosh', self.t - 0.12))
        self.t += shot.dur
        return shot

    def cap(self, *a, **k):
        c = Caption(*a, **k); self.caps.append(c); return c

    def shot_at(self, T):
        for s in self.shots:
            if s.start <= T < s.start + s.dur: return s
        return self.shots[-1]

    def frame(self, T):
        W, H = self.W, self.H
        s = self.shot_at(T)
        im = s.frame(W, H, T - s.start, T).convert('RGB')
        # 휙 넘기기 : 컷 앞뒤 0.1초, 방향으로 밀리며 흐려진다
        WH = 0.1
        nxt = None
        for i, x in enumerate(self.shots):
            if x is s and i + 1 < len(self.shots): nxt = self.shots[i + 1]
        if s.whip_in and T - s.start < WH:
            im = whip(im, (1 - (T - s.start) / WH), s.whip_in, +1)
        elif nxt is not None and nxt.whip_in and nxt.start - T < WH:
            im = whip(im, 1 - (nxt.start - T) / WH, nxt.whip_in, -1)
        canvas = im.convert('RGBA')
        for o in self.overlays: o(canvas, T)
        for c in self.caps: c.draw(canvas, T)
        a = 0.0
        for (t0, st) in self.flashes:
            if t0 <= T < t0 + 0.22: a = max(a, st * (1 - (T - t0) / 0.22) ** 2)
        out = canvas.convert('RGB')
        if a > 0: out = Image.blend(out, Image.new('RGB', out.size, (255, 255, 255)), a)
        return out

    def render(self, path, audio=None):
        n = int(round(self.t * FPS))
        for s in self.shots: pass
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{self.W}x{self.H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', path],
                             stdin=subprocess.PIPE)
        cur = None
        for i in range(n):
            T = i / FPS
            s = self.shot_at(T)
            if s is not cur:   # 다음 샷이 쓸 원본 구간을 미리 푼다
                cur = s; s.prepare()
                for x in self.shots:
                    if x.start > s.start and x.start - s.start < 0.2: x.prepare()
            p.stdin.write(self.frame(T).tobytes())
            if i % 60 == 0: print(f'  {T:5.1f}s / {self.t:.1f}s', flush=True)
        p.stdin.close(); p.wait()


def whip(im, k, direction, side):
    """k 1 → 가장 많이 밀림. direction : 'l' | 'r' | 'u' | 'd' (화면이 움직이는 방향)"""
    k = clamp(k)
    if k <= 0.01: return im
    W, H = im.size
    e = EASE['in'](k)
    vx, vy = {'l': (-1, 0), 'r': (1, 0), 'u': (0, -1), 'd': (0, 1)}[direction]
    off = e * (W if vx else H) * 0.35 * (1 if side < 0 else -1)
    a = np.asarray(im).astype(np.float32)
    acc = np.zeros_like(a)
    n = 7; span = 40 + 260 * e
    for j in range(n):
        d = int(off + (j / (n - 1) - .5) * span)
        acc += np.roll(a, d * vx, axis=1) if vx else np.roll(a, d * vy, axis=0)
    return Image.fromarray((acc / n).astype(np.uint8))


# ======================================================================================
#  효과음 · 비트 (numpy 합성, 48kHz)
# ======================================================================================
SR = 48000
rng = np.random.default_rng(7)

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def lowpass(x, fc):
    # 한 극 저역 통과 (간단하게)
    a = math.exp(-2 * math.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    b = 1 - a
    for i in range(len(x)): acc = b * x[i] + a * acc; y[i] = acc
    return y

def lp_fast(x, fc, passes=2):
    # 이동 평균 여러 번 = 저역 통과 (빠름)
    k = max(1, int(SR / fc / 2))
    for _ in range(passes): x = np.convolve(x, np.ones(k) / k, mode='same')
    return x

def hp_fast(x, fc): return x - lp_fast(x, fc)

def s_kick(g=1.0):
    n = int(.42 * SR); t = np.arange(n) / SR
    f = 45 + 105 * np.exp(-t / .035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = hp_fast(rng.standard_normal(n), 3000) * np.exp(-t / .004) * .25
    return g * (np.sin(ph) * np.exp(-t / .16) + click)

def s_hat(g=1.0, d=.035):
    n = int(.12 * SR); x = hp_fast(rng.standard_normal(n), 7000)
    return g * x * env(n, .0005, d) * .5

def s_clap(g=1.0):
    n = int(.3 * SR); x = hp_fast(lp_fast(rng.standard_normal(n), 5000), 900)
    e = np.zeros(n); t = np.arange(n) / SR
    for o in (0, .011, .022): e += (t >= o) * np.exp(-np.maximum(t - o, 0) / .012) * .6
    e += (t >= .03) * np.exp(-np.maximum(t - .03, 0) / .09)
    return g * x * e * .7

def s_bass(freq, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + .35 * np.sin(2 * np.pi * freq * 2 * t) + .12 * np.sin(2 * np.pi * freq * 3 * t)
    e = np.minimum(1, t / .006) * np.minimum(1, (dur - t) / .03) * (0.65 + .35 * np.exp(-t / .12))
    return g * x * e * .5

def s_whoosh(g=1.0, dur=.32):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    lo = lp_fast(x, 2500); hi = hp_fast(lo, 400)
    k = t / dur
    e = np.sin(np.pi * k) ** 2 * (0.3 + 0.7 * k)
    return g * hi * e * .9

def s_pop(g=1.0, f0=900):
    n = int(.09 * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.2 * np.exp(-t / .01))
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .025) * .55

def s_tap(g=1.0):
    n = int(.06 * SR); t = np.arange(n) / SR
    x = hp_fast(rng.standard_normal(n), 2500) * np.exp(-t / .006) * .6 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t / .01) * .4
    return g * x

def s_key(g=1.0):
    n = int(.04 * SR); t = np.arange(n) / SR
    return g * hp_fast(rng.standard_normal(n), 4000) * np.exp(-t / .004) * .45

def s_impact(g=1.0):
    n = int(1.4 * SR); t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t / .08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .5)
    noise = lp_fast(rng.standard_normal(n), 1800) * np.exp(-t / .25) * .8
    return g * (boom + noise) * .9

def s_riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; k = t / dur
    x = rng.standard_normal(n)
    # 높아지는 대역 : 짧은 창으로 저역 통과 → 빼서 고역
    lo = lp_fast(x, 600); hi = x - lo
    tone = np.sin(2 * np.pi * np.cumsum(300 + 900 * k ** 2) / SR) * .25
    return g * (hi * .35 + lo * .2 * (1 - k) + tone) * k ** 2.2

def s_ding(g=1.0):
    n = int(1.2 * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1318.5, 1, .5), (1975.5, .5, .35), (2637, .3, .2), (659.25, .4, .6)))
    return g * x * np.minimum(1, t / .002) * .35

SFX = {'kick': s_kick, 'hat': s_hat, 'clap': s_clap, 'whoosh': s_whoosh, 'pop': s_pop, 'tap': s_tap, 'key': s_key, 'impact': s_impact, 'ding': s_ding}

def mix_audio(dur, events, beat_from, beat_to, path, drop=()):
    """events : [(이름, 시각, 크기)] / beat_from~beat_to 사이에 4/4 비트 / drop : 비트를 잠깐 비우는 구간 [(a, b)]"""
    n = int((dur + 1.5) * SR)
    music = np.zeros(n); fx = np.zeros(n)
    def put(buf, x, t):
        i = int(t * SR)
        if i < 0: x = x[-i:]; i = 0
        j = min(n, i + len(x)); buf[i:j] += x[:j - i]
    def dropped(t): return any(a <= t < b for a, b in drop)
    # 비트 : 킥(정박) · 클랩(2, 4박) · 하이햇(8분 뒷박) · 베이스(A 단조 i-VI-III-VII)
    roots = [55.0, 43.65, 65.41, 49.0]
    b = 0; t = beat_from
    while t < beat_to - 1e-6:
        if not dropped(t):
            put(music, s_kick(1.0), t)
            if b % 2 == 1: put(music, s_clap(.55), t)
            put(music, s_hat(.35), t + BEAT / 2)
            if b % 2 == 0: put(music, s_hat(.18, .02), t + BEAT * .75)
            bar = (b // 4) % 4
            put(music, s_bass(roots[bar], BEAT * .45, .55), t + BEAT * .5)
            if b % 4 == 3: put(music, s_bass(roots[bar] * 1.5, BEAT * .2, .35), t + BEAT * .78)
        b += 1; t += BEAT
    for name, t, g in events:
        if name == 'riser': put(fx, s_riser(g[0], g[1]), t); continue
        put(fx, SFX[name](g), t)
    # 효과음이 크게 날 때 음악을 살짝 눌러 준다 (덕킹)
    e = np.abs(lp_fast(np.abs(fx), 30, 1))
    duck = 1 - np.clip(e * 1.2, 0, .45)
    out = music * .55 * duck + fx * .8
    out = np.tanh(out * 1.1) * .9   # 부드러운 클리핑
    out = out[:int(dur * SR)]
    fade = int(.35 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    st = np.stack([out, out], 1)
    st = (st / max(1e-6, np.abs(st).max()) * 0.89 * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())


def finish(video, wav, out_music, out_silent):
    # 소리 있는 판 : 라우드니스 -14 LUFS (Reels 기준) / 소리 없는 판 : 무음 트랙(일부 업로드 화면이 오디오 트랙을 요구)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out_music], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out_silent], check=True)
    print('→', out_music); print('→', out_silent)
