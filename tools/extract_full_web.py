#!/usr/bin/env python3
import struct
import os
import zlib

tpz_path = '/tmp/export_templates.tpz'
out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'
os.makedirs(out_dir, exist_ok=True)

with open(tpz_path, 'rb') as f:
    data = f.read()

print(f"Total file size: {len(data)}")

def extract_file_from_zip(zip_data, filename_to_extract):
    """Extract a file from raw zip data by parsing local file headers"""
    pos = 0
    while pos < len(zip_data) - 4:
        if zip_data[pos:pos+4] == b'PK\x03\x04':
            try:
                compression = struct.unpack('<H', zip_data[pos+8:pos+10])[0]
                compressed_size = struct.unpack('<I', zip_data[pos+18:pos+22])[0]
                uncompressed_size = struct.unpack('<I', zip_data[pos+22:pos+26])[0]
                filename_len = struct.unpack('<H', zip_data[pos+26:pos+28])[0]
                extra_len = struct.unpack('<H', zip_data[pos+28:pos+30])[0]
                filename = zip_data[pos+30:pos+30+filename_len].decode('utf-8')
                
                header_end = pos + 30 + filename_len + extra_len
                file_data_start = header_end
                file_data_end = file_data_start + compressed_size
                
                if filename == filename_to_extract:
                    print(f"Found {filename} at offset {pos}")
                    print(f"  Compression method: {compression}")
                    print(f"  Compressed size: {compressed_size}")
                    print(f"  Uncompressed size: {uncompressed_size}")
                    
                    compressed_data = zip_data[file_data_start:file_data_end]
                    print(f"  First 20 bytes: {compressed_data[:20].hex()}")
                    
                    # Try different decompression methods
                    uncompressed = None
                    if compression == 0:
                        uncompressed = compressed_data
                        print("  No compression, using raw data")
                    elif compression == 8:
                        # Try different wbits values for deflate
                        for wbits in [15, -15, 31, 47]:
                            try:
                                uncompressed = zlib.decompress(compressed_data, wbits)
                                print(f"  Decompressed with wbits={wbits}")
                                break
                            except:
                                pass
                        if uncompressed is None:
                            print("  Trying with stripped zlib header...")
                            if len(compressed_data) > 2 and compressed_data[0] == 0x78:
                                try:
                                    uncompressed = zlib.decompress(compressed_data)
                                    print("  Decompressed with default zlib")
                                except:
                                    pass
                    
                    return uncompressed
                
                pos = file_data_end
            except Exception as e:
                print(f"Error at {pos}: {e}")
                pos += 1
        else:
            pos += 1
    return None

# First, find the web_nothreads_release.zip or web_dlink_nothreads_release.zip inside the tpz
print("\n=== Searching for web template zip in tpz ===")
pos = 0
web_zip_data = None
web_zip_name = None

while pos < len(data) - 4:
    if data[pos:pos+4] == b'PK\x03\x04':
        try:
            compressed_size = struct.unpack('<I', data[pos+18:pos+22])[0]
            filename_len = struct.unpack('<H', data[pos+26:pos+28])[0]
            extra_len = struct.unpack('<H', data[pos+28:pos+30])[0]
            filename = data[pos+30:pos+30+filename_len].decode('utf-8', errors='replace')
            
            if 'nothreads_release' in filename and filename.endswith('.zip'):
                print(f"Found web template: {filename}")
                header_end = pos + 30 + filename_len + extra_len
                file_data = data[header_end:header_end+compressed_size]
                pk_pos = file_data.find(b'PK\x03\x04')
                if pk_pos > 0:
                    file_data = file_data[pk_pos:]
                web_zip_data = file_data
                web_zip_name = filename
                print(f"  Size: {len(file_data)}")
                print(f"  First 20 bytes: {file_data[:20].hex()}")
                break
            
            header_end = pos + 30 + filename_len + extra_len
            pos = header_end + compressed_size
        except:
            pos += 1
    else:
        pos += 1

if web_zip_data:
    print(f"\n=== Extracting files from {web_zip_name} ===")
    for inner_file in ['godot.js', 'godot.wasm', 'godot.audio.worklet.js']:
        extracted = extract_file_from_zip(web_zip_data, inner_file)
        if extracted and len(extracted) > 0:
            out_path = os.path.join(out_dir, inner_file)
            with open(out_path, 'wb') as f:
                f.write(extracted)
            print(f"  Saved to {out_path} ({len(extracted)} bytes)")
            if inner_file == 'godot.wasm':
                print(f"  WASM header: {extracted[:4].hex()} (expected: 0061736d)")
        else:
            print(f"  WARNING: Could not extract {inner_file}")

print("\nDone!")
