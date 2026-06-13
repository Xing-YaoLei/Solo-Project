#!/usr/bin/env python3
import struct
import os

def extract_web_templates(tpz_path, out_dir):
    with open(tpz_path, 'rb') as f:
        data = f.read()
    
    print(f"File size: {len(data)} bytes")
    
    os.makedirs(out_dir, exist_ok=True)
    
    # Find all local file headers (PK\x03\x04)
    pos = 0
    web_files_found = []
    
    while pos < len(data) - 4:
        if data[pos:pos+4] == b'PK\x03\x04':
            # Parse local file header
            try:
                version = struct.unpack('<H', data[pos+4:pos+6])[0]
                flags = struct.unpack('<H', data[pos+6:pos+8])[0]
                compression = struct.unpack('<H', data[pos+8:pos+10])[0]
                mod_time = struct.unpack('<H', data[pos+10:pos+12])[0]
                mod_date = struct.unpack('<H', data[pos+12:pos+14])[0]
                crc32 = struct.unpack('<I', data[pos+14:pos+18])[0]
                compressed_size = struct.unpack('<I', data[pos+18:pos+22])[0]
                uncompressed_size = struct.unpack('<I', data[pos+22:pos+26])[0]
                filename_len = struct.unpack('<H', data[pos+26:pos+28])[0]
                extra_len = struct.unpack('<H', data[pos+28:pos+30])[0]
                
                filename = data[pos+30:pos+30+filename_len].decode('utf-8', errors='replace')
                
                header_end = pos + 30 + filename_len + extra_len
                file_data_start = header_end
                file_data_end = file_data_start + compressed_size
                
                if 'web' in filename.lower() and filename.endswith('.zip'):
                    print(f"\nFound web template: {filename}")
                    print(f"  Compressed size: {compressed_size}")
                    print(f"  Uncompressed size: {uncompressed_size}")
                    print(f"  Data range: {file_data_start}-{file_data_end}")
                    
                    if file_data_end <= len(data):
                        file_data = data[file_data_start:file_data_end]
                        
                        # Save this file
                        basename = os.path.basename(filename)
                        out_path = os.path.join(out_dir, basename)
                        with open(out_path, 'wb') as out_f:
                            out_f.write(file_data)
                        print(f"  Saved to: {out_path}")
                        
                        web_files_found.append(out_path)
                    else:
                        print(f"  WARNING: File data extends beyond file end!")
                        print(f"  Need: {file_data_end}, Have: {len(data)}")
                
                # Move to next header
                pos = file_data_end
                
            except Exception as e:
                print(f"Error parsing header at {pos}: {e}")
                pos += 1
        else:
            pos += 1
    
    print(f"\n\nTotal web templates found: {len(web_files_found)}")
    return web_files_found

if __name__ == '__main__':
    tpz_path = '/tmp/export_templates.tpz'
    out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable'
    extract_web_templates(tpz_path, out_dir)
