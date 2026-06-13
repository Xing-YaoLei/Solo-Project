#!/usr/bin/env python3
import zipfile
import zlib
import struct
import os

zip_path = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable/web_nothreads_release.zip'
out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'

with open(zip_path, 'rb') as f:
    data = f.read()

print(f'File size: {len(data)}')
print(f'First 10 bytes: {data[:10].hex()}')

pos = 0
while pos < len(data) - 4:
    if data[pos:pos+4] == b'PK\x03\x04':
        try:
            compression = struct.unpack('<H', data[pos+8:pos+10])[0]
            compressed_size = struct.unpack('<I', data[pos+18:pos+22])[0]
            uncompressed_size = struct.unpack('<I', data[pos+22:pos+26])[0]
            filename_len = struct.unpack('<H', data[pos+26:pos+28])[0]
            extra_len = struct.unpack('<H', data[pos+28:pos+30])[0]
            filename = data[pos+30:pos+30+filename_len].decode('utf-8', errors='replace')
            
            print(f'\nFound: {filename}')
            print(f'  Compression: {compression}')
            print(f'  Compressed: {compressed_size}, Uncompressed: {uncompressed_size}')
            
            file_start = pos + 30 + filename_len + extra_len
            file_end = file_start + compressed_size
            
            if file_end <= len(data):
                compressed_data = data[file_start:file_end]
                print(f'  Data first 20 bytes: {compressed_data[:20].hex()}')
                
                if compression == 8:
                    for wbits in [15, -15, 31, 47]:
                        try:
                            uncompressed = zlib.decompress(compressed_data, wbits)
                            print(f'  Decompressed with wbits={wbits}: {len(uncompressed)} bytes')
                            print(f'  Result first 20 bytes: {uncompressed[:20].hex()}')
                            
                            out_path = os.path.join(out_dir, filename)
                            with open(out_path, 'wb') as f:
                                f.write(uncompressed)
                            print(f'  Saved to {out_path}')
                            break
                        except Exception as e:
                            print(f'  wbits={wbits} failed: {e}')
                elif compression == 0:
                    out_path = os.path.join(out_dir, filename)
                    with open(out_path, 'wb') as f:
                        f.write(compressed_data)
                    print(f'  No compression, saved directly')
            
            pos = file_end
        except Exception as e:
            print(f'Error: {e}')
            pos += 1
    else:
        pos += 1

print('\nDone!')
