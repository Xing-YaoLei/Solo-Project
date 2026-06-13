#!/usr/bin/env python3
"""
手动构建Godot 4.3 Web运行时环境
从GitHub release下载完整的Web模板文件
"""
import os
import urllib.request
import ssl
import zipfile
import shutil

# 禁用SSL验证（解决tuxfamily的SSL问题）
ssl._create_default_https_context = ssl._create_unverified_context

OUTPUT_DIR = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web'
TEMPLATE_DIR = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/tools/godot_home/Library/Application Support/Godot/export_templates/4.3.stable'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMPLATE_DIR, exist_ok=True)

def download_file(url, dest):
    print(f'Downloading: {url}')
    try:
        urllib.request.urlretrieve(url, dest)
        size = os.path.getsize(dest)
        print(f'  Downloaded: {dest} ({size} bytes)')
        return True
    except Exception as e:
        print(f'  Failed: {e}')
        return False

def try_download_from_github():
    """尝试从GitHub release下载Web模板"""
    base_urls = [
        'https://github.com/godotengine/godot/releases/download/4.3-stable',
        'https://downloads.tuxfamily.org/godotengine/4.3',
    ]
    
    files_needed = [
        'Godot_v4.3-stable_web_nothreads_release.zip',
        'Godot_v4.3-stable_web_nothreads_debug.zip',
    ]
    
    for base in base_urls:
        for filename in files_needed:
            url = f'{base}/{filename}'
            dest = os.path.join(TEMPLATE_DIR, filename.replace('Godot_v4.3-stable_', ''))
            
            # 如果文件已存在且大于10MB，跳过
            if os.path.exists(dest) and os.path.getsize(dest) > 10_000_000:
                print(f'Skipping {filename} (already exists)')
                continue
                
            if download_file(url, dest):
                # 验证是否是有效zip
                try:
                    with zipfile.ZipFile(dest, 'r') as z:
                        names = z.namelist()
                        print(f'  Valid zip, contains: {names[:3]}...')
                        return True
                except Exception as e:
                    print(f'  Invalid zip: {e}')
                    os.remove(dest)
    return False

def extract_and_build_web_runtime():
    """从模板zip中提取运行时文件并构建完整Web环境"""
    web_template = os.path.join(TEMPLATE_DIR, 'web_nothreads_release.zip')
    
    if not os.path.exists(web_template):
        print(f'ERROR: {web_template} not found')
        return False
    
    try:
        with zipfile.ZipFile(web_template, 'r') as z:
            names = z.namelist()
            print(f'Template contents: {names}')
            
            # 提取所有文件到output目录
            for name in names:
                if name.endswith('/'):
                    continue
                out_path = os.path.join(OUTPUT_DIR, os.path.basename(name))
                with z.open(name) as src, open(out_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)
                print(f'  Extracted: {out_path}')
        
        print('\nWeb runtime extracted successfully!')
        return True
    except Exception as e:
        print(f'ERROR extracting template: {e}')
        return False

if __name__ == '__main__':
    print('=== Building Godot 4.3 Web Runtime ===\n')
    
    # 第一步：尝试下载Web模板
    print('Step 1: Downloading web templates...')
    if try_download_from_github():
        print('Templates downloaded successfully!\n')
    else:
        print('Template download failed, will try alternative approach...\n')
    
    # 第二步：提取运行时文件
    print('Step 2: Extracting web runtime files...')
    if extract_and_build_web_runtime():
        print('\n✅ Web runtime built successfully!')
    else:
        print('\n❌ Failed to build web runtime')
