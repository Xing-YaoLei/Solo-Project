#!/usr/bin/env python3
import os
import json
import hashlib
import re
from pathlib import Path

def stable_uuid(path: str) -> str:
    return hashlib.md5(path.encode('utf-8')).hexdigest().lower()

def parse_ccclass(content: str, filename_stem: str = None):
    pattern = r'@ccclass\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
    matches = re.findall(pattern, content)
    if not matches:
        return None
    if filename_stem and filename_stem in matches:
        return filename_stem
    return matches[0]

def main():
    base_dir = Path('/Users/yaoleyxing/Developer/solo-mange-pro/MP0217/assets/scripts')
    ts_files = list(base_dir.rglob('*.ts'))
    
    generated = 0
    skipped = 0
    class_mapping = {}
    
    for ts_file in sorted(ts_files):
        meta_file = ts_file.with_suffix('.ts.meta')
        
        rel_path = str(ts_file.relative_to(Path('/Users/yaoleyxing/Developer/solo-mange-pro/MP0217')))
        uuid = stable_uuid(rel_path)
        
        with open(ts_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        ccclass_name = parse_ccclass(content, ts_file.stem)
        if ccclass_name:
            class_mapping[ccclass_name] = uuid
        
        if meta_file.exists():
            skipped += 1
            print(f'[SKIP] {ts_file} (.meta already exists)')
        else:
            meta_data = {
                "ver": "1.1.25",
                "importer": "typescript",
                "imported": True,
                "uuid": uuid,
                "files": [],
                "subMetas": {},
                "userData": {
                    "isPlugin": False,
                    "isNative": False
                }
            }
            
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump(meta_data, f, indent=2, ensure_ascii=False)
                f.write('\n')
            
            generated += 1
            class_info = f" [{ccclass_name}]" if ccclass_name else ""
            print(f'[GEN]  {ts_file} -> {meta_file} (uuid: {uuid}){class_info}')
    
    print(f'\n========== 汇总 ==========')
    print(f'总 .ts 文件数: {len(ts_files)}')
    print(f'新生成 .meta: {generated}')
    print(f'跳过已存在: {skipped}')
    print(f'\n========== 类名 UUID 映射 ==========')
    for class_name, uuid in sorted(class_mapping.items()):
        print(f'{class_name}: {uuid}')
    
    print(f'\nPython dict:')
    print(json.dumps(class_mapping, indent=2, ensure_ascii=False))
    
    return class_mapping

if __name__ == '__main__':
    main()
