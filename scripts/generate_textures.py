#!/usr/bin/env python3
import struct, zlib, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX_DIR = os.path.join(BASE, 'assets', 'resources', 'textures')
os.makedirs(TEX_DIR, exist_ok=True)

def make_png(path, w, h, r, g, b, a=255):
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes([r, g, b, a])
    comp = zlib.compress(raw)
    with open(path, 'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', comp) + chunk(b'IEND', b''))

textures = [
    ('tile_floor.png', 32, 32, 240, 230, 210),
    ('tile_wall.png', 32, 32, 180, 160, 140),
    ('tile_door.png', 32, 32, 139, 90, 43),
    ('tile_desk.png', 32, 32, 160, 120, 80),
    ('tile_equipment.png', 32, 32, 100, 150, 200),
    ('tile_bed.png', 32, 32, 200, 220, 255),
    ('ui_panel_bg.png', 64, 64, 250, 250, 248),
    ('ui_button_normal.png', 128, 48, 33, 150, 243),
    ('ui_button_pressed.png', 128, 48, 25, 118, 210),
    ('ui_tab_active.png', 128, 40, 255, 255, 255),
    ('ui_tab_inactive.png', 128, 40, 230, 230, 230),
    ('ui_border.png', 8, 8, 200, 200, 200),
    ('ui_success_bg.png', 64, 64, 232, 245, 233),
    ('ui_failure_bg.png', 64, 64, 255, 235, 238),
    ('icon_star.png', 32, 32, 255, 215, 0),
    ('icon_star_empty.png', 32, 32, 200, 200, 200),
    ('icon_clue_doc.png', 32, 32, 66, 165, 245),
    ('icon_clue_physical.png', 32, 32, 76, 175, 80),
    ('icon_warning.png', 32, 32, 255, 152, 0),
    ('icon_insurance.png', 32, 32, 156, 39, 176),
]

for name, w, h, r, g, b in textures:
    make_png(os.path.join(TEX_DIR, name), w, h, r, g, b)

print(f'Created {len(textures)} textures in {TEX_DIR}')
for t in textures:
    print(f'  - {t[0]} ({t[1]}x{t[2]})')
