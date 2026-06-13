#!/usr/bin/env python3
import struct
import zipfile
import io
import os

with open('/tmp/export_templates.tpz', 'rb') as f:
    data = f.read()

print('First 4 bytes:', data[:4])
print('First 20 bytes hex:', data[:20].hex())
print('File size:', len(data))

# Godot .tpz is actually a zip with a custom header prefix
# Let's find the first valid zip file entry
for start in range(0, 20):
    test_data = data[start:]
    if test_data[:4] == b'PK\x03\x04':
        print(f'Trying offset {start}...')
        try:
            with zipfile.ZipFile(io.BytesIO(test_data), 'r') as z:
                names = z.namelist()
                print(f'Valid zip at offset {start}!')
                print(f'Total files: {len(names)}')
                
                web_files = [n for n in names if 'web' in n.lower()]
                print(f'\nWeb template files ({len(web_files)}):')
                for w in web_files:
                    print(f'  - {w}')
                
                # Extract web templates
                out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/export_templates/4.3.stable/'
                z.extractall(out_dir)
                print(f'\nExtracted all files to {out_dir}')
                break
        except Exception as e:
            print(f'  Failed: {e}')
