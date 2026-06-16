#!/usr/bin/env python3
import struct, zlib, os

def make_png(width, height, pixels):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            idx = (y * width + x) * 4
            raw += bytes(pixels[idx:idx+4])
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(base, 'assets', 'resources', 'maps')
os.makedirs(out_dir, exist_ok=True)

colors = [
    (180, 220, 180, 255),
    (120, 120, 120, 255),
    (139, 90, 43, 255),
    (160, 140, 100, 255),
    (180, 180, 220, 255),
    (200, 160, 120, 255),
]

tw, th = 32, 32
cols, rows = 3, 2
sw, sh = tw * cols, th * rows
pixels = [0] * (sw * sh * 4)

for i, color in enumerate(colors):
    col = i % cols
    row = i // cols
    for py in range(th):
        for px in range(tw):
            sx = col * tw + px
            sy = row * th + py
            idx = (sy * sw + sx) * 4
            edge = px == 0 or px == tw - 1 or py == 0 or py == th - 1
            if edge:
                pixels[idx:idx+4] = [max(0, c - 40) for c in color]
            else:
                pixels[idx:idx+4] = list(color)

out = make_png(sw, sh, pixels)
out_path = os.path.join(out_dir, 'tileset.png')
with open(out_path, 'wb') as f:
    f.write(out)
print(f'Created tileset.png {sw}x{sh} at {out_path}')
