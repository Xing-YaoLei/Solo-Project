#!/usr/bin/env python3
"""验证 UIController.prefab 的结构"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'UIController.prefab')

with open(path, 'r') as f:
    data = json.load(f)

print(f'Total objects: {len(data)}')
print()

# 统计类型
type_counts = {}
for obj in data:
    t = obj.get('__type__', 'unknown')
    type_counts[t] = type_counts.get(t, 0) + 1
print('Type counts:')
for t, c in sorted(type_counts.items()):
    print(f'  {t}: {c}')
print()

# 找到 UIController 脚本
ui_script = None
for obj in data:
    if obj.get('__type__') == 'cc.Script' and obj.get('name') == 'UIController':
        ui_script = obj
        break

if ui_script:
    print('UIController script @properties:')
    for key, val in sorted(ui_script.items()):
        if key.startswith('_') or key in ('__type__', '__id__', 'name', '__scriptAsset',
            '_objFlags', 'node', '_enabled', '__prefab', '_id'):
            continue
        if isinstance(val, dict) and '__id__' in val:
            target = data[val['__id__']]
            target_name = target.get('_name', target.get('__type__', '?'))
            print(f'  {key}: __id__={val["__id__"]} ({target_name})')
    print()

# 检查各个 root 的 active
roots = ['levelSelectRoot', 'gameplayRoot', 'settlementRoot', 'leaderboardRoot']
print('Root active states:')
for obj in data:
    name = obj.get('_name', '')
    if name in roots:
        print(f'  {name}: active={obj.get("_active")}')
        print(f'    children: {[data[c["__id__"]]["_name"] for c in obj.get("_children", [])]}')
print()

# 检查各面板脚本
panel_names = ['LevelSelectPanel', 'TaskPanel', 'CluePanel', 'ActionPanel', 'SettlementPanel', 'LeaderboardPanel']
print('Panel scripts found:')
for obj in data:
    if obj.get('__type__') == 'cc.Script' and obj.get('name') in panel_names:
        print(f'  {obj["name"]}: __id__={obj["__id__"]}')
        # 数一下 @property
        prop_count = 0
        for key in obj:
            if not key.startswith('_') and key not in ('__type__', '__id__', 'name', '__scriptAsset',
                '_objFlags', 'node', '_enabled', '__prefab', '_id') and isinstance(obj[key], dict) and '__id__' in obj[key]:
                prop_count += 1
        print(f'    properties: {prop_count}')
print()

# 检查 SettlementPanel 的 Tab active
print('SettlementPanel tab panels:')
for obj in data:
    name = obj.get('_name', '')
    if name in ('nursingLogPanel', 'billingDetailPanel'):
        print(f'  {name}: active={obj.get("_active")}')
print()

# 检查 ActionPanel 的 feedback
print('ActionPanel feedback:')
for obj in data:
    name = obj.get('_name', '')
    if name in ('feedbackSection', 'proceedButton'):
        print(f'  {name}: active={obj.get("_active")}')

print('\n✅ 验证完成')
