#!/usr/bin/env python3
import json

with open('assets/resources/prefabs/LevelSelectPanel.prefab', 'r') as f:
    data = json.load(f)

print(f'总对象数: {len(data)}')
print()

print('=== 节点层级结构 ===')
def print_tree(node_id, indent=0):
    obj = data[node_id]
    if obj.get('__type__') != 'cc.Node':
        return
    name = obj.get('_name', 'unnamed')
    comps = obj.get('_components', [])
    comp_types = []
    for c in comps:
        cid = c.get('__id__')
        if cid is not None and cid < len(data):
            comp_types.append(data[cid].get('__type__', '?'))
    print('  ' * indent + f'[{node_id}] {name} (components: {", ".join(comp_types)})')
    children = obj.get('_children', [])
    for child_ref in children:
        if '__id__' in child_ref:
            print_tree(child_ref['__id__'], indent + 1)

for i, obj in enumerate(data):
    if obj.get('__type__') == 'cc.Node' and obj.get('_parent') is None:
        print_tree(i)
        break

print()
print('=== Script 属性引用 ===')
script_obj = None
for obj in data:
    if obj.get('__type__') == 'cc.Script' and obj.get('name') == 'LevelSelectPanel':
        script_obj = obj
        break

if script_obj:
    properties = ['levelScrollView', 'levelContainer', 'totalScoreLabel', 'playerLevelLabel', 'coinsLabel']
    for prop in properties:
        ref = script_obj.get(prop)
        if ref and '__id__' in ref:
            ref_id = ref['__id__']
            ref_obj = data[ref_id]
            print(f'  {prop} -> [{ref_id}] {ref_obj.get("__type__", "?")}')
        else:
            print(f'  {prop} -> NULL')

print()
print('=== Label 内容 ===')
for i, obj in enumerate(data):
    if obj.get('__type__') == 'cc.Label':
        text = obj.get('_string', '')
        fs = obj.get('_fontSize', 0)
        uos = obj.get('_useOriginalSize', '?')
        print(f'  [{i}] "{text}" (fontSize={fs}, useOriginalSize={uos})')

print()
print('=== ScrollView content ===')
for obj in data:
    if obj.get('__type__') == 'cc.ScrollView':
        content = obj.get('_content')
        if content and '__id__' in content:
            cid = content['__id__']
            cobj = data[cid]
            print(f'  _content -> [{cid}] {cobj.get("_name", "?")}')
