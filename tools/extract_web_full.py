#!/usr/bin/env python3
import struct
import zlib
import os

tpz_path = '/tmp/export_templates.tpz'
template_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable'
out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'

os.makedirs(template_dir, exist_ok=True)
os.makedirs(out_dir, exist_ok=True)

with open(tpz_path, 'rb') as f:
    data = f.read()

print(f'TPZ file size: {len(data)}')

def find_pk_headers(data, start_pos=0, max_count=100):
    """Find all PK\x03\x04 headers"""
    pos = start_pos
    headers = []
    while pos < len(data) - 4 and len(headers) < max_count:
        if data[pos:pos+4] == b'PK\x03\x04':
            headers.append(pos)
        pos += 1
    return headers

# First, find all web template entries in the tpz
print('\n=== Finding web template entries in TPZ ===')
pos = 0
web_entries = []

while pos < len(data) - 4:
    if data[pos:pos+4] == b'PK\x03\x04':
        try:
            compression = struct.unpack('<H', data[pos+8:pos+10])[0]
            compressed_size = struct.unpack('<I', data[pos+18:pos+22])[0]
            uncompressed_size = struct.unpack('<I', data[pos+22:pos+26])[0]
            filename_len = struct.unpack('<H', data[pos+26:pos+28])[0]
            extra_len = struct.unpack('<H', data[pos+28:pos+30])[0]
            filename = data[pos+30:pos+30+filename_len].decode('utf-8', errors='replace')
            
            if 'web' in filename.lower() and filename.endswith('.zip'):
                print(f'Found: {filename}')
                print(f'  Compression: {compression}, Compressed: {compressed_size}, Uncompressed: {uncompressed_size}')
                
                file_start = pos + 30 + filename_len + extra_len
                file_end = file_start + compressed_size
                
                compressed_data = data[file_start:file_end]
                print(f'  First 10 bytes: {compressed_data[:10].hex()}')
                
                # Decompress if needed
                if compression == 8 and len(compressed_data) > 0:
                    try:
                        uncompressed = zlib.decompress(compressed_data, -15)
                        print(f'  Decompressed: {len(uncompressed)} bytes')
                        print(f'  Decompressed first 10 bytes: {uncompressed[:10].hex()}')
                        
                        # Save the inner zip file
                        inner_zip_name = filename.replace('templates/', '')
                        inner_zip_path = os.path.join(template_dir, inner_zip_name)
                        with open(inner_zip_path, 'wb') as f:
                            f.write(uncompressed)
                        print(f'  Saved inner zip to: {inner_zip_path}')
                        
                        # Also try to extract contents of this inner zip
                        web_entries.append((inner_zip_name, uncompressed))
                    except Exception as e:
                        print(f'  Decompression failed: {e}')
                elif compression == 0:
                    print(f'  No compression')
                    
                    inner_zip_name = filename.replace('templates/', '')
                    inner_zip_path = os.path.join(template_dir, inner_zip_name)
                    with open(inner_zip_path, 'wb') as f:
                        f.write(compressed_data)
                    print(f'  Saved to: {inner_zip_path}')
                    web_entries.append((inner_zip_name, compressed_data))
            
            pos = file_end
        except Exception as e:
            print(f'Error at {pos}: {e}')
            pos += 1
    else:
        pos += 1

# Now extract contents from the inner zips
print('\n=== Extracting contents from web template zips ===')
for name, zip_data in web_entries:
    print(f'\nProcessing: {name}')
    
    # Find files in this inner zip
    inner_pos = 0
    while inner_pos < len(zip_data) - 4:
        if zip_data[inner_pos:inner_pos+4] == b'PK\x03\x04':
            try:
                compression = struct.unpack('<H', zip_data[inner_pos+8:inner_pos+10])[0]
                compressed_size = struct.unpack('<I', zip_data[inner_pos+18:inner_pos+22])[0]
                uncompressed_size = struct.unpack('<I', zip_data[inner_pos+22:inner_pos+26])[0]
                filename_len = struct.unpack('<H', zip_data[inner_pos+26:inner_pos+28])[0]
                extra_len = struct.unpack('<H', zip_data[inner_pos+28:inner_pos+30])[0]
                filename = zip_data[inner_pos+30:inner_pos+30+filename_len].decode('utf-8', errors='replace')
                
                print(f'  File: {filename}')
                
                file_start = inner_pos + 30 + filename_len + extra_len
                file_end = file_start + compressed_size
                
                file_data = zip_data[file_start:file_end]
                
                if compression == 8:
                    uncompressed = zlib.decompress(file_data, -15)
                elif compression == 0:
                    uncompressed = file_data
                else:
                    uncompressed = None
                    print(f'    Unknown compression: {compression}')
                
                if uncompressed:
                    out_path = os.path.join(out_dir, filename)
                    with open(out_path, 'wb') as f:
                        f.write(uncompressed)
                    print(f'    Saved: {out_path} ({len(uncompressed)} bytes)')
                    if filename == 'godot.wasm':
                        print(f'    WASM header: {uncompressed[:4].hex()} (expected: 0061736d)')
                
                inner_pos = file_end
            except Exception as e:
                print(f'  Error: {e}')
                inner_pos += 1
        else:
            inner_pos += 1

# Also create the expected filenames for Godot
print('\n=== Creating expected template filenames ===')
pairs = [
    ('web_dlink_nothreads_debug.zip', 'web_nothreads_debug.zip'),
    ('web_dlink_nothreads_release.zip', 'web_nothreads_release.zip'),
]
import shutil
for src, dst in pairs:
    src_path = os.path.join(template_dir, src)
    dst_path = os.path.join(template_dir, dst)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f'Copied {src} -> {dst}')

print('\nDone!')
