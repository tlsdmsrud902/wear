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
        for src, keys in getattr(self.render, 'needs', []):
            ts = [k[1] for k in keys]; Clip.get(src).load(min(ts), max(ts))
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


_bc = {}
def band_img(W, h, a, align, x0):
    k = (W, h, align, int(x0))
    if k not in _bc:
        y = np.linspace(-1, 1, h)[:, None]; x = np.linspace(0, 1, W)[None, :]
        prof = np.cos(np.clip(np.abs(y), 0, 1) * np.pi / 2) ** 1.3
        if align == 'left':
            prof = prof * np.clip(1.25 - x * 1.6, 0, 1) ** 1.2
        else:
            prof = prof * np.ones((1, W))
        _bc[k] = prof
    m = (_bc[k] * a).astype(np.uint8)
    im = np.zeros((h, W, 4), np.uint8); im[..., 3] = m
    return Image.fromarray(im)


class Caption:
    """lines : [[(단어, 스타일)], …] / t_in, t_out : 전체 시각 / at : 화면에서 글 묶음의 가운데 (x, y) / align : center|left
       단어는 t_in 부터 stagger 간격으로 하나씩 튀어나온다. times 를 주면 단어별 시각을 직접 정한다."""
    def __init__(self, t_in, t_out, lines, at, size=96, stagger=0.12, anim='pop', align='center', times=None, gap=None, out='cut', band=225):
        self.t_in, self.t_out, self.lines, self.at, self.size, self.band = t_in, t_out, lines, at, size, band
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
        # 글 뒤를 부드럽게 어둡게 (화면 속 글자와 섞이지 않게)
        if self.band:
            kb = clamp((T - self.pops[0]) / 0.15) * (clamp((self.t_out - T) / 0.1) if self.out == 'fade' else 1)
            bh = int(total + self.size * 2.2)
            canvas.alpha_composite(band_img(canvas.width, bh, int(self.band * kb), self.align, x0), (0, int(self.at[1] - bh / 2)))
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

def band(x, lo=0, hi=SR / 2):
    # FFT 로 대역만 남긴다 (부드러운 경사) — 효과음이 날카롭게 '치익' 거리지 않게
    n = len(x); F = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo > 0: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi < SR / 2: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(F * m, n)

def s_pluck(freqs, g=1.0, d=.22):
    n = int(.5 * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for f0 in freqs:
        for h in range(1, 7): x += np.sin(2 * np.pi * f0 * h * t + h) / h * np.exp(-t * h * 2.2 / d / 3)
    return g * band(x * env(n, .003, d), 0, 3200) * .22

def s_kick(g=1.0):
    n = int(.42 * SR); t = np.arange(n) / SR
    f = 45 + 105 * np.exp(-t / .035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = band(rng.standard_normal(n), 1500, 5000) * np.exp(-t / .004) * .3
    return g * (np.sin(ph) * np.exp(-t / .16) + click)

def s_hat(g=1.0, d=.035):
    n = int(.12 * SR); x = band(rng.standard_normal(n), 6500, 11000)
    return g * x * env(n, .0005, d) * .45

def s_clap(g=1.0):
    n = int(.3 * SR); x = band(rng.standard_normal(n), 900, 4500) * 1.4
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
    hi = band(x, 250, 2600)
    k = t / dur
    e = np.sin(np.pi * k) ** 2 * (0.3 + 0.7 * k)
    return g * hi * e * .9

def s_pop(g=1.0, f0=900):
    n = int(.09 * SR); t = np.arange(n) / SR
    f = f0 * (1 + 1.2 * np.exp(-t / .01))
    return g * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .025) * .55

def s_tap(g=1.0):
    n = int(.06 * SR); t = np.arange(n) / SR
    x = band(rng.standard_normal(n), 1500, 6000) * np.exp(-t / .006) * .7 + np.sin(2 * np.pi * 1400 * t) * np.exp(-t / .012) * .4
    return g * x

def s_key(g=1.0):
    n = int(.04 * SR); t = np.arange(n) / SR
    return g * band(rng.standard_normal(n), 2500, 7000) * np.exp(-t / .004) * .5

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
    lo = band(x, 0, 600); hi = band(x, 600, 7000)
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
    CHORDS = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
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
            if b % 2 == 1: put(music, s_pluck(CHORDS[bar], .9), t + BEAT * .5)
            if b % 4 == 0: put(music, s_pluck(CHORDS[bar], .6, .35), t)
        b += 1; t += BEAT
    for name, t, g in events:
        if name == 'riser': put(fx, s_riser(g[0], g[1]), t); continue
        put(fx, SFX[name](g), t)
    # 효과음이 크게 날 때 음악을 살짝 눌러 준다 (덕킹)
    e = np.abs(lp_fast(np.abs(fx), 30, 1))
    duck = 1 - np.clip(e * 1.2, 0, .45)
    out = music * .55 * duck + fx * .8
    out = np.tanh(out * 1.1) * .9   # 부드러운 클리핑
    out = band(out, 30, 13000)
    out = out[:int(dur * SR)]
    fade = int(.35 * SR); out[-fade:] *= np.linspace(1, 0, fade)
    st = np.stack([out, out], 1)
    st = (st / max(1e-6, np.abs(st).max()) * 0.89 * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())


def finish(video, wav, out_music, out_silent):
    # 소리 있는 판 : 라우드니스 -14 LUFS (Reels 기준) / 소리 없는 판 : 무음 트랙(일부 업로드 화면이 오디오 트랙을 요구)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9,alimiter=limit=0.84:level=false', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out_music], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out_silent], check=True)
    print('→', out_music); print('→', out_silent)


# ======================================================================================
#  기기 틀 (PC 창 · 휴대폰) — 주소창은 일부러 비워 둔다
# ======================================================================================
def rounded_mask(w, h, r):
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255); return m

def pc_window(arr, w, zoom=1.0, cx=.5, cy=.5):
    """PC 화면을 창 틀(점 세 개 + 빈 막대)에 넣는다 → RGBA"""
    bar = int(w * .032); h = int(w * 9 / 16)
    scr = camera(arr, w, h, zoom, cx, cy)
    im = Image.new('RGBA', (w, h + bar), (0, 0, 0, 0))
    frame = Image.new('RGBA', (w, h + bar), (236, 236, 236, 255))
    d = ImageDraw.Draw(frame)
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        r = bar * .2; x = bar * .7 + i * bar * .6; d.ellipse((x - r, bar / 2 - r, x + r, bar / 2 + r), fill=c)
    d.rounded_rectangle((w * .3, bar * .22, w * .7, bar * .78), int(bar * .3), fill=(250, 250, 250))
    frame.paste(scr, (0, bar))
    im.paste(frame, (0, 0), rounded_mask(w, h + bar, int(bar * .5)))
    return im

def phone(arr, w, zoom=1.0, cx=.5, cy=.5):
    """세로 화면(9:16)을 휴대폰 틀에 넣는다 → RGBA"""
    sw = w; sh = int(w * 16 / 9)
    scr = camera(arr, sw, sh, zoom, cx, cy).convert('RGBA')
    b = int(w * .045)
    im = Image.new('RGBA', (sw + 2 * b, sh + 2 * b), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, sw + 2 * b - 1, sh + 2 * b - 1), int(w * .13), fill=(18, 18, 18, 255), outline=(70, 70, 70, 255), width=3)
    im.paste(scr, (b, b), rounded_mask(sw, sh, int(w * .1)))
    return im

_sh = {}
def drop_shadow(canvas, im, xy, blur=30, op=150):
    # 그림자 모양은 틀 크기마다 한 번만 흐리게 만들어 둔다 (매 프레임 흐리기는 느리다)
    k = (im.size, blur, op)
    if k not in _sh:
        pad = blur * 3
        a = Image.new('L', (im.width + 2 * pad, im.height + 2 * pad), 0)
        a.paste(im.split()[3].point(lambda v: op if v > 0 else 0), (pad, pad))
        sh = Image.new('RGBA', a.size, (0, 0, 0, 0)); sh.putalpha(a.filter(ImageFilter.GaussianBlur(blur)))
        _sh[k] = (sh, pad)
    sh, pad = _sh[k]
    canvas.alpha_composite(sh, (int(xy[0] - pad), int(xy[1] + 18 - pad))) if xy[0] - pad >= 0 and xy[1] + 18 - pad >= 0 else canvas.paste(sh, (int(xy[0] - pad), int(xy[1] + 18 - pad)), sh)
    canvas.alpha_composite(im, (int(xy[0]), int(xy[1])))

def dark_bg(W, H):
    g = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    r = np.sqrt(((np.arange(W)[None, :] - W * .5) / W) ** 2 + ((np.arange(H)[:, None] - H * .35) / H) ** 2)
    v = (34 - 26 * np.clip(r * 1.6, 0, 1) - 4 * g).astype(np.uint8)
    return Image.fromarray(np.stack([v, v, v], 2)).convert('RGBA')

_bg = {}
def bg_cached(W, H):
    if (W, H) not in _bg: _bg[(W, H)] = dark_bg(W, H)
    return _bg[(W, H)].copy()


def devices(pc_src, pc_t, ph_src, ph_t, layout):
    """PC 창 + 휴대폰을 한 화면에 (반응형). layout : 'v' (세로 영상) | 'h' (가로 영상)"""
    def render(W, H, u, tl, T):
        c = bg_cached(W, H)
        pa = Clip.get(pc_src).at(keyed(pc_t, u)); pb = Clip.get(ph_src).at(keyed(ph_t, u))
        k = EASE['out'](clamp(tl / .35))
        if layout == 'v':
            pw = phone(pb, 300); win = pc_window(pa, 1000)
            drop_shadow(c, win, (40, int(300 - 60 * (1 - k))))
            drop_shadow(c, pw, (int(640 + 200 * (1 - k)), 660))
        else:
            win = pc_window(pa, 1180); pw = phone(pb, 300)
            drop_shadow(c, win, (int(560 - 80 * (1 - k)), 150))
            drop_shadow(c, pw, (int(1480 + 160 * (1 - k)), 360))
        return c
    render.needs = [(pc_src, pc_t), (ph_src, ph_t)]
    return render


def window_over(page_src, page_t, win_src, win_t, cam_keys, win_w=1080, win_x=760, win_y=70, pop=0.25):
    """가로 영상 : PC 페이지 위에 편집 창(새 창)이 뜬 모습. cam_keys 는 편집 창 안을 확대하는 카메라 (zoom, cx, cy)"""
    def render(W, H, u, tl, T):
        base = camera(Clip.get(page_src).at(keyed(page_t, u)), W, H).convert('RGBA')
        base = Image.blend(base, Image.new('RGBA', (W, H), (0, 0, 0, 255)), .45)
        z, cx, cy = keyed(cam_keys, u)
        wh = H - win_y - 40
        k = EASE['back'](clamp(tl / pop)) if pop else 1
        scr = camera(Clip.get(win_src).at(keyed(win_t, u)), win_w, wh, z, cx, cy)
        bar = 34
        win = Image.new('RGBA', (win_w, wh + bar), (236, 236, 236, 255))
        d = ImageDraw.Draw(win)
        for i, col in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
            d.ellipse((16 + i * 22 - 6, bar / 2 - 6, 16 + i * 22 + 6, bar / 2 + 6), fill=col)
        d.rounded_rectangle((win_w * .3, 8, win_w * .7, bar - 8), 8, fill=(250, 250, 250))
        win.paste(scr, (0, bar))
        m = rounded_mask(win_w, wh + bar, 14)
        win.putalpha(m)
        if k < 1:
            s = max(.05, .85 + .15 * k)
            win = win.resize((int(win_w * s), int((wh + bar) * s)), Image.BILINEAR)
            a = np.array(win); a[..., 3] = (a[..., 3] * clamp(k * 1.5)).astype(np.uint8); win = Image.fromarray(a)
        x = int(win_x + (win_w - win.width) / 2); y = int(win_y + (wh + bar - win.height) / 2)
        drop_shadow(base, win, (x, y), 34, 170)
        return base
    render.needs = [(page_src, page_t), (win_src, win_t)]
    return render


# ======================================================================================
#  마지막 장면 : 로고 · 가격 · 검색
# ======================================================================================
def cta(bg_src, bg_t, layout):
    # 자리 · 크기 (세로 / 가로)
    G = dict(kick=(500, 34), logo=(575, 124), sub=(760, 52), old=(900, 60), new=(1060, 104), lab=(1152, 50), bar=(1230, 760, 120, 58), kmong=(1400, 36)) if layout == 'v' else \
        dict(kick=(104, 34), logo=(150, 190), sub=(372, 54), old=(470, 54), new=(612, 108), lab=(716, 42), bar=(782, 760, 110, 54), kmong=(930, 34))
    def render(W, H, u, tl, T):
        arr = Clip.get(bg_src).at(keyed(bg_t, u))
        b = camera(arr, W // 4, H // 4, 1.1 + .08 * u).filter(ImageFilter.GaussianBlur(5)).resize((W, H), Image.BILINEAR)
        c = Image.blend(b.convert('RGB'), Image.new('RGB', (W, H), (8, 8, 8)), .8).convert('RGBA')
        d = ImageDraw.Draw(c)
        cx = W / 2
        # 로고 (0초) : 크게 → 제자리로 쾅, 그 뒤로 글자 사이가 아주 천천히 벌어진다
        y0, s0 = G['logo']
        k = clamp(tl / .28); sc = 1 + 0.9 * (1 - EASE['out'](k))
        lf = font('jost', 600, int(s0 * sc))
        txt = 'WEARPICK'; sp = int(s0 * .09 * sc + s0 * .06 * EASE['out'](clamp(tl / 3)))
        tw = sum(d.textlength(ch, font=lf) for ch in txt) + sp * (len(txt) - 1)
        y_logo = y0 - (lf.size - s0) * .5
        x = cx - tw / 2
        for ch in txt:
            d.text((x, y_logo), ch, font=lf, fill=(255, 255, 255, int(255 * clamp(k * 2)))); x += d.textlength(ch, font=lf) + sp
        def ctext(t0, key, s, f, fill, anim=.25):
            kk = clamp((tl - t0) / anim)
            if kk <= 0: return None
            y = G[key][0]
            tw = d.textlength(s, font=f); a = int(255 * clamp(kk * 2))
            yy = y + (1 - EASE['out'](kk)) * 30
            d.text((cx - tw / 2, yy), s, font=f, fill=fill[:3] + (a,))
            return tw
        ctext(.12, 'kick', 'CAFE24 SHOP SKIN', font('jost', 500, G['kick'][1]), (170, 170, 170, 255))
        ctext(.35, 'sub', '카페24 여성 의류 쇼핑몰 스킨', font('pre', 'Bold', G['sub'][1]), (235, 235, 235, 255))
        # 정가 (가로줄이 그어진다) → 런칭가 (빛이 지나간다)
        fpr = font('pre', 'Bold', G['old'][1])
        tw = ctext(.75, 'old', '정가 250,000원', fpr, (185, 185, 185, 255))
        if tw:
            kk = EASE['out'](clamp((tl - .95) / .2))
            if kk > 0:
                yl = G['old'][0] + fpr.size * .62
                d.line((cx - tw / 2 - 8, yl, cx - tw / 2 - 8 + (tw + 16) * kk, yl), fill=(255, 255, 255, 230), width=6)
        if tl >= 1.0:
            lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            Caption(T - tl + 1.0, 1e9, [[('런칭가', 'white'), ('220,000원', 'y')]], (cx, G['new'][0]), size=G['new'][1], stagger=.12, band=0).draw(lay, T)
            ph = (tl - 1.5) % 1.6
            if tl > 1.5 and ph < .45:   # 반짝
                a = np.array(lay); hh, ww = a.shape[:2]
                xs = np.arange(ww)[None, :] + np.arange(hh)[:, None] * .5
                pos = (cx - 520) + ph / .45 * 1100
                g = np.clip(1 - np.abs(xs - pos) / 60, 0, 1) * .55
                rgb = a[..., :3].astype(np.float32); rgb += (255 - rgb) * g[..., None]
                a[..., :3] = rgb.astype(np.uint8); lay = Image.fromarray(a)
            c.alpha_composite(lay)
        # 디자인센터 검색창 (WEARPICK 을 쳐 넣는다)
        if tl >= 1.55:
            ys, bw, bh, fs = G['bar']
            ctext(1.55, 'lab', '카페24 디자인센터에서 검색', font('pre', 'Bold', G['lab'][1]), (255, 255, 255, 255), .2)
            kk = EASE['out'](clamp((tl - 1.6) / .25))
            x0 = cx - bw / 2
            d.rounded_rectangle((x0, ys, x0 + bw * (.6 + .4 * kk), ys + bh), bh // 2, fill=(255, 255, 255, int(255 * kk)))
            n = int(clamp((tl - 1.85) / .45) * 8)
            q = 'WEARPICK'[:n]
            fq = font('jost', 600, fs)
            d.text((x0 + bh * .55, ys + bh / 2), q, font=fq, fill=(15, 15, 15), anchor='lm')
            if n < 8 or int(tl * 3) % 2 == 0:
                qx = x0 + bh * .55 + d.textlength(q, font=fq) + 6
                d.line((qx, ys + bh * .25, qx, ys + bh * .75), fill=(15, 15, 15), width=4)
            r = bh * .2; mx, my = x0 + bw - bh * .62, ys + bh / 2 - 4
            if kk > .9:
                d.ellipse((mx - r, my - r, mx + r, my + r), outline=(15, 15, 15), width=6)
                d.line((mx + r * .7, my + r * .7, mx + r * 1.5, my + r * 1.5), fill=(15, 15, 15), width=7)
        ctext(2.35, 'kmong', '크몽에서도 구매할 수 있어요', font('pre', 'Medium', G['kmong'][1]), (175, 175, 175, 255))
        return c
    render.needs = [(bg_src, bg_t)]
    return render


# ======================================================================================
#  세로 15초 (Reels) — 3초 안에 : 사장님 부르기 → 한 줄 요약 → 쿠폰 50% 공개
# ======================================================================================
def vertical(only_audio=False):
    W, H = 1080, 1920
    tl = Timeline(W, H)
    TX = 500          # 자막 가운데 x (오른쪽 140px 은 Reels 버튼 자리라 비운다)
    S = lambda dur, src, t, cam, **k: Shot(dur, src, t, cam, **k)
    M = 'cap-m-'
    # ---------- 0 ~ 3.5초 : 훅 ----------
    tl.add(S(.5, M + 'coupon', [(0, 1.55), (1, 2.6, 'lin')], [(0, (1.32, .5, .52)), (1, (1.18, .5, .52), 'out')]))
    tl.add(S(.5, M + 'coupon', [(0, 2.6), (1, 3.95, 'lin')], [(0, (1.0, .5, .5)), (1, (1.08, .5, .52), 'out')]))
    tl.add(S(.5, M + 'coupon', [(0, 4.47), (1, 4.97, 'lin')], [(0, (1.45, .5, .56)), (1, (1.38, .5, .56), 'out')]))
    tl.add(S(1.0, M + 'coupon', [(0, 4.97), (1, 5.5, 'lin')], [(0, (1.45, .5, .56)), (.5, (1.6, .5, .56), 'lin'), (1, (2.1, .5, .56), 'in')], shake=[(0, 1.0, 9)]))
    tl.add(S(1.0, M + 'coupon', [(0, 5.51), (.25, 5.6, 'lin'), (1, 6.4, 'lin')], [(0, (1.25, .5, .6)), (.2, (1.62, .5, .62), 'out'), (1, (1.75, .5, .62), 'lin')],
             shake=[(0, .45, 26)]), flash=.85)
    tl.cap(0.0, 1.5, [[('카페24', 'w'), ('의류몰', 'w')], [('사장님!', 'y')]], (TX, 420), size=124, times=[-0.12, 0.06, 0.3])
    tl.cap(1.5, 2.5, [[('쿠폰 뽑기', 'w'), ('타임세일', 'w')], [('클릭 수정', 'w')], [('스킨 하나로 끝', 'y')]], (TX, 430), size=98, times=[1.5, 1.62, 1.76, 2.0])
    tl.cap(2.5, 3.5, [[('고객이 직접 뽑는', 'w')], [('랜덤 쿠폰', 'y')]], (TX, 1330), size=104, times=[2.56, 2.72])
    # ---------- 3.5 ~ 5.5초 : 마감 카운트다운 · 세일 페이지 ----------
    tl.add(S(.75, M + 'sale', [(0, .3), (1, 1.35, 'lin')], [(0, (1.4, .45, .23)), (1, (1.15, .5, .25), 'out')]), whip='u')
    tl.add(S(.75, M + 'sale', [(0, 1.35), (1, 2.35, 'lin')], [(0, (1.18, .5, .55)), (1, (1.05, .5, .55), 'out')]))
    tl.add(S(.5, M + 'sale', [(0, 5.9), (1, 7.9, 'io')], [(0, (1.05, .5, .5)), (1, (1.15, .5, .5))]))
    tl.cap(3.5, 4.25, [[('마감', 'w'), ('카운트다운', 'y')]], (TX, 1330), size=108, times=[3.55, 3.7])
    tl.cap(4.25, 5.5, [[('세일 페이지까지', 'w')], [('통째로 완성', 'y')]], (TX, 1000), size=100, times=[4.27, 4.42])
    # ---------- 5.5 ~ 10초 : 코딩 없이 클릭으로 수정 (실제 편집 화면) ----------
    tl.add(S(.75, M + 'edit', [(0, .6), (1, 1.75, 'lin')], [(0, (1.0, .5, .5)), (1, (1.5, .3, .36), 'io')]), whip='l')
    tl.add(S(.5, M + 'editor', [(0, .15), (1, .8, 'lin')], [(0, (1.32, .5, .24)), (1, (1.22, .5, .26), 'out')]), flash=.35)
    tl.add(S(1.25, M + 'editor', [(0, 2.5), (.15, 2.75, 'lin'), (1, 4.62, 'lin')], [(0, (1.3, .48, .51)), (1, (1.55, .48, .51), 'out')]))
    tl.add(S(.5, M + 'editor', [(0, 5.55), (1, 6.2, 'lin')], [(0, (1.7, .4, .43)), (1, (1.45, .4, .43), 'out')]))
    tl.add(S(1.5, M + 'after', [(0, .62), (.25, 1.15, 'lin'), (1, 3.4, 'lin')], [(0, (1.0, .5, .5)), (.3, (1.0, .5, .55)), (1, (1.45, .3, .73), 'io')],
             shake=[(.4, .75, 14)]))
    tl.cap(5.5, 6.75, [[('코딩 없이', 'y')], [('클릭으로 수정', 'w')]], (TX, 1330), size=112, times=[5.55, 5.75])
    tl.cap(6.75, 8.0, [[('글자 바꾸고', 'w')]], (TX, 1330), size=104, times=[6.8])
    tl.cap(8.0, 8.5, [[('저장', 'y')]], (TX, 1180), size=120, times=[8.2])
    tl.cap(8.9, 10.0, [[('바로', 'w'), ('반영 끝!', 'y')]], (TX, 430), size=118, times=[8.92, 9.08])
    # ---------- 10 ~ 12초 : 반응형 ----------
    tl.add(Shot(1.0, render=devices('cap-p-home', [(0, 1.2), (1, 2.6, 'lin')], M + 'home', [(0, 1.2), (1, 2.6, 'lin')], 'v')), whip='l')
    tl.add(S(1.0, M + 'home', [(0, 2.75), (1, 7.4, 'io')], [(0, (1.0, .5, .5)), (1, (1.06, .5, .5))]))
    tl.cap(10.0, 11.0, [[('PC · 모바일', 'w')], [('자동 반응형', 'y')]], (TX, 1370), size=104, times=[10.05, 10.2])
    tl.cap(11.0, 12.0, [[('여성 의류몰', 'w')], [('전용 디자인', 'y')]], (TX, 430), size=104, times=[11.02, 11.17])
    # ---------- 12 ~ 15초 : 가격 · 검색 ----------
    tl.add(Shot(3.0, render=cta(M + 'home', [(0, 8.0), (1, 11.0, 'lin')], 'v')), flash=.7)

    # 효과음
    ev = [('impact', 2.5, .9), ('riser', 1.5, (1.0, .8)), ('impact', 12.0, .7), ('ding', 13.0, .7)]
    ev += [('tap', 1.26, .8), ('tap', 6.07, .8), ('tap', 8.22, .9)]
    ev += [('key', 6.95 + i * 0.075, .6) for i in range(13)]
    ev += [('key', 13.86 + i * .056, .45) for i in range(8)]
    for c in tl.caps: ev += [('pop', t, .35) for t in c.pops]
    ev += [(n, t, g) for n, t in [(x[0], x[1]) for x in tl.sfx] for g in [.7]]
    ev += [('whoosh', t - .1, .35) for t in (.5, 1.0, 1.5, 4.25, 5.0, 6.0, 8.0, 8.5, 11.0)]
    return tl, ev, dict(beat=(0, 15.0), drop=[(1.5, 2.5)])


# ======================================================================================
#  가로 30초 (크몽 · 디자인센터) — 실제 PC 화면이 화면을 꽉 채우고, 자막은 왼쪽
# ======================================================================================
def horizontal():
    W, H = 1920, 1080
    tl = Timeline(W, H)
    S = lambda dur, src, t, cam, **k: Shot(dur, src, t, cam, **k)
    P, M = 'cap-p-', 'cap-m-'
    L = lambda t0, t1, lines, y, size=84, **k: tl.cap(t0, t1, lines, (110, y), size=size, align='left', **k)
    # ---------- 0 ~ 4초 : 훅 ----------
    tl.add(S(.5, P + 'coupon', [(0, 1.5), (1, 2.5, 'lin')], [(0, (1.6, .5, .45)), (1, (1.42, .5, .45), 'out')]))
    tl.add(S(.5, P + 'coupon', [(0, 2.5), (1, 3.9, 'lin')], [(0, (1.12, .5, .45)), (1, (1.2, .5, .45), 'out')]))
    tl.add(S(.5, P + 'coupon', [(0, 4.95), (1, 5.6, 'lin')], [(0, (1.5, .5, .42)), (1, (1.45, .5, .42), 'out')]))
    tl.add(S(1.0, P + 'coupon', [(0, 5.6), (1, 6.2, 'lin')], [(0, (1.55, .5, .42)), (1, (2.0, .5, .4), 'in')], shake=[(0, 1, 5)]))
    tl.add(S(1.5, P + 'coupon', [(0, 6.21), (.15, 6.3, 'lin'), (1, 7.6, 'lin')], [(0, (1.15, .44, .3)), (.13, (1.5, .42, .3), 'out'), (1, (1.6, .41, .3), 'lin')],
             shake=[(0, .45, 26)]), flash=.85)
    L(0.0, 1.5, [[('카페24 의류몰', 'w')], [('사장님!', 'y')]], 300, 112, times=[-0.12, 0.2])
    L(1.5, 2.5, [[('쿠폰 뽑기', 'w'), ('타임세일', 'w'), ('클릭 수정', 'w')], [('스킨 하나로 끝', 'y')]], 270, 88, times=[1.5, 1.62, 1.74, 1.98])
    L(2.5, 4.0, [[('고객이 직접 뽑는', 'w')], [('랜덤 쿠폰', 'y')]], 820, 96, times=[2.56, 2.72])
    # ---------- 4 ~ 7.5초 : ① 쿠폰 뽑기 자세히 ----------
    tl.add(S(1.5, P + 'coupon', [(0, 7.4), (1, 9.1, 'lin')], [(0, (1.0, .5, .5)), (1, (1.12, .5, .45), 'io')]), whip='l')
    tl.add(Shot(2.0, render=devices(P + 'coupon', [(0, 5.3), (1, 7.6, 'lin')], M + 'coupon', [(0, 4.45), (1, 6.6, 'lin')], 'h')))
    L(4.0, 5.5, [[('①', 'y'), ('랜덤 쿠폰 뽑기', 'w')], [('5% ~ 50%', 'w')]], 830, 84, times=[4.04, 4.14, 4.4])
    L(5.5, 7.5, [[('회원 1인 1회', 'w')], [('뽑으면 바로', 'w')], [('마이쿠폰 발급', 'y')]], 540, 76, times=[5.55, 5.75, 5.9])
    # ---------- 7.5 ~ 11.5초 : ② 마감 카운트다운 · 세일 페이지 ----------
    tl.add(S(1.25, P + 'sale', [(0, .2), (1, 1.6, 'lin')], [(0, (3.4, .54, .075)), (1, (3.0, .54, .08), 'out')]), whip='u')
    tl.add(S(1.25, P + 'sale', [(0, 1.6), (1, 3.4, 'lin')], [(0, (1.15, .3, .4)), (1, (1.02, .5, .5), 'out')]))
    tl.add(S(1.5, P + 'sale', [(0, 4.0), (1, 7.7, 'io')], [(0, (1.0, .5, .5)), (1, (1.08, .5, .5))]))
    L(7.5, 8.75, [[('②', 'y'), ('마감 카운트다운', 'w')]], 860, 88, times=[7.55, 7.65])
    L(8.75, 11.5, [[('세일 전용 페이지', 'w')], [('통째로 들어 있어요', 'y')]], 820, 84, times=[8.8, 8.98])
    # ---------- 11.5 ~ 20초 : ③ 코딩 없이 클릭으로 수정 ----------
    tl.add(S(1.5, P + 'edit', [(0, .4), (1, 2.6, 'lin')], [(0, (1.0, .5, .5)), (.45, (1.0, .5, .5)), (1, (2.6, .1, .1), 'io')]), whip='l')
    tl.add(Shot(1.5, render=window_over(P + 'edit', [(0, 2.6), (1, 3.2)], P + 'editor', [(0, .15), (1, 1.2, 'lin')],
                                         [(0, (1.0, .5, .5)), (1, (1.9, .37, .12), 'io')])), flash=.25)
    tl.add(Shot(2.5, render=window_over(P + 'edit', [(0, 2.9), (1, 3.0)], P + 'editor', [(0, 2.0), (1, 5.45, 'lin')],
                                         [(0, (1.5, .35, .45)), (.2, (1.85, .3, .5)), (1, (1.95, .3, .5), 'lin')], pop=0)))
    tl.add(Shot(1.0, render=window_over(P + 'edit', [(0, 2.9), (1, 3.0)], P + 'editor', [(0, 6.65), (1, 7.65, 'lin')],
                                         [(0, (1.9, .78, .4)), (1, (2.2, .82, .4), 'out')], pop=0)))
    tl.add(S(2.0, P + 'after', [(0, .55), (.2, 1.1, 'lin'), (1, 3.4, 'lin')], [(0, (1.0, .5, .5)), (.3, (1.0, .5, .5)), (1, (1.28, .24, .33), 'io')],
             shake=[(.32, .62, 14)]))
    L(11.5, 13.0, [[('③', 'y'), ('코딩 없이', 'w')], [('클릭으로 수정', 'y')]], 830, 92, times=[11.55, 11.65, 11.85])
    L(13.0, 14.5, [[('[고치기]를 누르면', 'w')], [('편집 창이 열려요', 'w')]], 830, 72, times=[13.05, 13.2])
    L(14.5, 17.0, [[('지금 글이 채워진 칸에', 'w')], [('새 글만 쓰면', 'y')]], 830, 72, times=[14.55, 14.75])
    L(17.0, 18.0, [[('저장', 'y')]], 830, 100, times=[17.55])
    tl.cap(18.4, 20.0, [[('새로고침하면', 'w')], [('바로 반영!', 'y')]], (1380, 800), size=92, times=[18.42, 18.58])
    # ---------- 20 ~ 24초 : ④ 반응형 ----------
    tl.add(Shot(2.0, render=devices(P + 'home', [(0, .8), (1, 3.4, 'lin')], M + 'home', [(0, .8), (1, 3.4, 'lin')], 'h')), whip='l')
    tl.add(S(2.0, P + 'home', [(0, 3.4), (1, 10.5, 'io')], [(0, (1.0, .5, .5)), (1, (1.05, .5, .5))]))
    tl.cap(20.0, 22.0, [[('④', 'y')], [('PC · 모바일', 'w')], [('자동 반응형', 'y')]], (80, 540), size=70, align='left', times=[20.05, 20.15, 20.3])
    L(22.0, 24.0, [[('여성 의류몰에', 'w')], [('딱 맞춘 디자인', 'y')]], 820, 88, times=[22.04, 22.2])
    # ---------- 24 ~ 30초 : 가격 · 검색 ----------
    tl.add(Shot(6.0, render=cta(P + 'home', [(0, 4.0), (1, 10.0, 'lin')], 'h')), flash=.7)

    ev = [('impact', 2.5, .9), ('riser', 1.5, (1.0, .8)), ('impact', 24.0, .7), ('ding', 25.0, .7)]
    ev += [('tap', 1.36, .8), ('tap', 12.73, .8), ('tap', 15.08, .7), ('tap', 17.57, .9)]
    ev += [('key', 15.62 + i * .1, .55) for i in range(13)]
    ev += [('key', 25.86 + i * .056, .45) for i in range(8)]
    for c in tl.caps: ev += [('pop', t, .32) for t in c.pops]
    ev += [(x[0], x[1], .7) for x in tl.sfx]
    ev += [('whoosh', t - .1, .3) for t in (.5, 1.0, 1.5, 5.5, 8.75, 10.0, 13.0, 18.0, 22.0)]
    return tl, ev, dict(beat=(0, 30.0), drop=[(1.5, 2.5)])


def build(which):
    tl, ev, a = vertical() if which == 'v' else horizontal()
    name = 'wearpick-v2-reels-15s' if which == 'v' else 'wearpick-v2-16x9-30s'
    tmpv = os.path.join(OUT, '.' + name + '-video.mp4'); wav = os.path.join(OUT, '.' + name + '.wav')
    print(name, f'{tl.t:.2f}s')
    if os.environ.get('ONLY') != 'audio': tl.render(tmpv)
    mix_audio(tl.t, ev, a['beat'][0], a['beat'][1], wav, a['drop'])
    finish(tmpv, wav, os.path.join(OUT, name + '.mp4'), os.path.join(OUT, name + '-silent.mp4'))
    if os.environ.get('KEEP') != '1':
        for f in (tmpv, wav): os.remove(f)


if __name__ == '__main__':
    for w in (sys.argv[1:] or ['v', 'h']): build(w)
