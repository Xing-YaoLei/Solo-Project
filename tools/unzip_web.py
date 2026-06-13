#!/usr/bin/env python3
import zlib
import struct
import os

with open('/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable/web_debug_fixed.zip', 'rb') as f:
    data = f.read()

out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'
os.makedirs(out_dir, exist_ok=True)

pos = 0
while pos < len(data) - 4:
    if data[pos:pos+4] == b'PK\x03\x04':
        compressed_size = struct.unpack('<I', data[pos+18:pos+22])[0]
        uncompressed_size = struct.unpack('<I', data[pos+22:pos+26])[0]
        filename_len = struct.unpack('<H', data[pos+26:pos+28])[0]
        extra_len = struct.unpack('<H', data[pos+28:pos+30])[0]
        filename = data[pos+30:pos+30+filename_len].decode('utf-8')
        header_end = pos + 30 + filename_len + extra_len
        file_data = data[header_end:header_end+compressed_size]
        
        print(f'Processing: {filename}')
        print(f'  Compressed: {len(file_data)}, Expected: {compressed_size}')
        
        uncompressed = None
        for wbits in [15, -15, 31, 47]:
            try:
                uncompressed = zlib.decompress(file_data, wbits)
                print(f'  Success with wbits={wbits}')
                break
            except Exception as e:
                print(f'  wbits={wbits} failed: {e}')
        
        if uncompressed and len(uncompressed) > 0:
            out_path = os.path.join(out_dir, filename)
            with open(out_path, 'wb') as f:
                f.write(uncompressed)
            print(f'  Saved: {out_path} ({len(uncompressed)} bytes)')
            print(f'  First 8 bytes: {uncompressed[:8].hex()}')
        
        pos = header_end + compressed_size
    else:
        pos += 1

print('\nDone!')
