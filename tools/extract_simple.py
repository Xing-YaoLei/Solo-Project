#!/usr/bin/env python3
import struct
import zlib
import os
import shutil

tpz_path = '/tmp/export_templates.tpz'
template_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable'
out_dir = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'

os.makedirs(template_dir, exist_ok=True)
os.makedirs(out_dir, exist_ok=True)

with open(tpz_path, 'rb') as f:
    data = f.read()

print(f'TPZ size: {len(data)}')

# Find web_nothreads_release in tpz
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
            
            file_end = pos + 30 + filename_len + extra_len + compressed_size
            
            if 'web_dlink_nothreads_release' in filename:
                print(f'Found: {filename}')
                print(f'  Compression: {compression}, Compressed: {compressed_size}')
                
                file_start = pos + 30 + filename_len + extra_len
                compressed_data = data[file_start:file_start + compressed_size]
                
                # Decompress to get the inner zip
                if compression == 8:
                    inner_zip = zlib.decompress(compressed_data, -15)
                else:
                    inner_zip = compressed_data
                
                print(f'  Inner zip size: {len(inner_zip)}')
                print(f'  Inner zip header: {inner_zip[:4].hex()}')
                
                # Save template for Godot
                for target_name in ['web_nothreads_release.zip', 'web_nothreads_debug.zip']:
                    template_path = os.path.join(template_dir, target_name)
                    with open(template_path, 'wb') as f:
                        f.write(inner_zip)
                    print(f'  Saved template: {template_path}')
                
                # Now extract files from inner zip
                ipos = 0
                while ipos < len(inner_zip) - 4:
                    if inner_zip[ipos:ipos+4] == b'PK\x03\x04':
                        icomp = struct.unpack('<H', inner_zip[ipos+8:ipos+10])[0]
                        icomp_size = struct.unpack('<I', inner_zip[ipos+18:ipos+22])[0]
                        iuncomp_size = struct.unpack('<I', inner_zip[ipos+22:ipos+26])[0]
                        ifname_len = struct.unpack('<H', inner_zip[ipos+26:ipos+28])[0]
                        iextra_len = struct.unpack('<H', inner_zip[ipos+28:ipos+30])[0]
                        ifname = inner_zip[ipos+30:ipos+30+ifname_len].decode('utf-8', errors='replace')
                        
                        print(f'  Inner file: {ifname}')
                        
                        ifile_start = ipos + 30 + ifname_len + iextra_len
                        ifile_end = ifile_start + icomp_size
                        ifile_data = inner_zip[ifile_start:ifile_end]
                        
                        if icomp == 8:
                            iuncomp = zlib.decompress(ifile_data, -15)
                        else:
                            iuncomp = ifile_data
                        
                        out_path = os.path.join(out_dir, ifname)
                        with open(out_path, 'wb') as f:
                            f.write(iuncomp)
                        print(f'    Saved: {out_path} ({len(iuncomp)} bytes)')
                        if ifname == 'godot.wasm':
                            print(f'    WASM header: {iuncomp[:4].hex()}')
                        
                        ipos = ifile_end
                    else:
                        ipos += 1
                
                break
            
            pos = file_end
        except Exception as e:
            print(f'Error at {pos}: {e}')
            pos += 1
    else:
        pos += 1

print('\nDone!')
