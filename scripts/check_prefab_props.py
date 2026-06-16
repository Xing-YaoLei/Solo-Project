#!/usr/bin/env python3
"""检查面板 Prefab 的 @property 与 TypeScript 定义是否匹配"""
import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SCRIPT_DIR = os.path.join(BASE, 'assets', 'scripts', 'ui')
PREFAB_DIR = os.path.join(BASE, 'assets', 'resources', 'prefabs')

PANELS = [
    'TaskPanel',
    'CluePanel',
    'ActionPanel',
    'SettlementPanel',
    'LevelSelectPanel',
    'LeaderboardPanel',
    'HUDController',
    'UIController',
    'TutorialController',
]

def get_ts_properties(ts_path):
    """从 TypeScript 文件中提取 @property 定义"""
    props = []
    with open(ts_path, 'r') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('@property('):
            # 提取类型
            type_match = re.search(r'@property\((\w+)\)', line)
            prop_type = type_match.group(1) if type_match else 'unknown'
            # 下一行是属性名
            i += 1
            while i < len(lines) and lines[i].strip() == '':
                i += 1
            if i < len(lines):
                name_match = re.search(r'(\w+)\s*:', lines[i])
                if name_match:
                    props.append((name_match.group(1), prop_type))
        i += 1
    return props

def get_prefab_properties(prefab_path, script_name):
    """从 Prefab 文件中提取 cc.Script 的 @property"""
    with open(prefab_path, 'r') as f:
        data = json.load(f)
    
    for obj in data:
        if obj.get('__type__') == 'cc.Script' and obj.get('name') == script_name:
            props = []
            for key in obj:
                if (not key.startswith('_') and 
                    key not in ('__type__', '__id__', 'name', '__scriptAsset',
                               '_objFlags', 'node', '_enabled', '__prefab', '_id') and
                    isinstance(obj[key], dict) and '__id__' in obj[key]):
                    props.append(key)
            return props
    return []

print("=" * 60)
print("面板 Prefab @property 完整性检查")
print("=" * 60)

all_ok = True
for panel in PANELS:
    ts_path = os.path.join(SCRIPT_DIR, f'{panel}.ts')
    prefab_path = os.path.join(PREFAB_DIR, f'{panel}.prefab')
    
    if not os.path.exists(ts_path):
        print(f'\n❌ {panel}: TypeScript 文件不存在')
        all_ok = False
        continue
    if not os.path.exists(prefab_path):
        print(f'\n❌ {panel}: Prefab 文件不存在')
        all_ok = False
        continue
    
    ts_props = get_ts_properties(ts_path)
    prefab_props = get_prefab_properties(prefab_path, panel)
    
    ts_names = [p[0] for p in ts_props]
    missing = [p for p in ts_names if p not in prefab_props]
    extra = [p for p in prefab_props if p not in ts_names]
    
    status = '✅' if not missing else '❌'
    print(f'\n{status} {panel}:')
    print(f'  TS 定义: {len(ts_names)} 个属性')
    print(f'  Prefab: {len(prefab_props)} 个属性')
    
    if missing:
        all_ok = False
        print(f'  缺失 ({len(missing)}): {", ".join(missing)}')
    if extra:
        print(f'  多余 ({len(extra)}): {", ".join(extra)}')
    
    # 列出 TS 属性及其类型
    # for name, ptype in ts_props:
    #     status2 = '✅' if name in prefab_props else '❌'
    #     print(f'    {status2} {name}: {ptype}')

print("\n" + "=" * 60)
if all_ok:
    print("✅ 所有面板 @property 完整匹配！")
else:
    print("❌ 部分面板 @property 不完整")
print("=" * 60)
