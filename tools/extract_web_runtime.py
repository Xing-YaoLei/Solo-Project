#!/usr/bin/env python3
import struct
import zlib
import os

def extract_zip(raw_data, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    pos = 0
    extracted = []
    
    while pos < len(raw_data) - 4:
        if raw_data[pos:pos+4] == b'PK\x03\x04':
            try:
                version = struct.unpack('<H', raw_data[pos+4:pos+6])[0]
                flags = struct.unpack('<H', raw_data[pos+6:pos+8])[0]
                compression = struct.unpack('<H', raw_data[pos+8:pos+10])[0]
                mod_time = struct.unpack('<H', raw_data[pos+10:pos+12])[0]
                mod_date = struct.unpack('<H', raw_data[pos+12:pos+14])[0]
                crc32 = struct.unpack('<I', raw_data[pos+14:pos+18])[0]
                compressed_size = struct.unpack('<I', raw_data[pos+18:pos+22])[0]
                uncompressed_size = struct.unpack('<I', raw_data[pos+22:pos+26])[0]
                filename_len = struct.unpack('<H', raw_data[pos+26:pos+28])[0]
                extra_len = struct.unpack('<H', raw_data[pos+28:pos+30])[0]
                
                filename = raw_data[pos+30:pos+30+filename_len].decode('utf-8', errors='replace')
                
                header_end = pos + 30 + filename_len + extra_len
                file_data_start = header_end
                file_data_end = file_data_start + compressed_size
                
                if file_data_end > len(raw_data):
                    file_data_end = len(raw_data)
                
                compressed_data = raw_data[file_data_start:file_data_end]
                
                print(f"Found: {filename}")
                print(f"  Compressed: {compressed_size}, Uncompressed: {uncompressed_size}")
                print(f"  Compression: {compression}")
                
                if compression == 8:
                    try:
                        uncompressed_data = zlib.decompress(compressed_data, -15)
                    except:
                        print(f"  Decompression failed, trying raw...")
                        uncompressed_data = compressed_data
                else:
                    uncompressed_data = compressed_data
                
                if len(uncompressed_data) > 0:
                    out_path = os.path.join(out_dir, os.path.basename(filename))
                    with open(out_path, 'wb') as f:
                        f.write(uncompressed_data)
                    print(f"  Saved to: {out_path}")
                    extracted.append(out_path)
                
                pos = file_data_end
                
            except Exception as e:
                print(f"Error at {pos}: {e}")
                pos += 1
        else:
            pos += 1
    
    return extracted

if __name__ == '__main__':
    with open('/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable/web_debug_fixed.zip', 'rb') as f:
        data = f.read()
    
    out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'
    extracted = extract_zip(data, out_dir)
    print(f"\nExtracted {len(extracted)} files")
