#!/usr/bin/env python3
import os
import shutil

template_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable'

files = os.listdir(template_dir)
print(f'Files in template dir: {files}')

# Fix files by removing leading bytes before PK header
for f in files:
    if f.endswith('.zip'):
        fpath = os.path.join(template_dir, f)
        with open(fpath, 'rb') as fp:
            data = fp.read()
        pk_pos = data.find(b'PK\x03\x04')
        if pk_pos > 0:
            fixed = data[pk_pos:]
            with open(fpath, 'wb') as fp:
                fp.write(fixed)
            print(f'Fixed {f}: removed {pk_pos} leading bytes')

# Create the expected filenames
pairs = [
    ('web_dlink_nothreads_debug.zip', 'web_nothreads_debug.zip'),
    ('web_dlink_nothreads_release.zip', 'web_nothreads_release.zip'),
]

for src, dst in pairs:
    src_path = os.path.join(template_dir, src)
    dst_path = os.path.join(template_dir, dst)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f'Copied {src} -> {dst}')
    else:
        print(f'WARNING: {src} not found!')

print('\nFinal files:')
print(os.listdir(template_dir))
