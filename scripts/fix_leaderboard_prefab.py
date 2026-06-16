#!/usr/bin/env python3
"""生成 LeaderboardPanel.prefab 文件"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def generate_leaderboard_prefab():
    prefab = []
    
    # 0: LeaderboardPanel root node
    prefab.append({
        "__id__": 0,
        "__type__": "cc.Node",
        "_name": "LeaderboardPanel",
        "_objFlags": 0,
        "node": None,
        "_parent": None,
        "_children": [
            {"__id__": 2},
            {"__id__": 5},
            {"__id__": 8},
            {"__id__": 11},
            {"__id__": 13},
            {"__id__": 18}
        ],
        "_active": True,
        "_components": [
            {"__id__": 1},
            {"__id__": 22}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "6f687173"
    })
    
    # 1: LeaderboardPanel UITransform
    prefab.append({
        "__id__": 1,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 700, "height": 550},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "8714e582cdf1495197683879499c229f"
    })
    
    # 2: titleLabel node
    prefab.append({
        "__id__": 2,
        "__type__": "cc.Node",
        "_name": "titleLabel",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 3},
            {"__id__": 4}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 240, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "cd58e1c3"
    })
    
    # 3: titleLabel UITransform
    prefab.append({
        "__id__": 3,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 2},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 300, "height": 40},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "560c8cbc01184738b3e11e83a7d992e0"
    })
    
    # 4: titleLabel Label
    prefab.append({
        "__id__": 4,
        "__type__": "cc.Label",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 2},
        "_enabled": True,
        "__prefab": None,
        "_useOriginalSize": False,
        "_string": "排行榜",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 28,
        "_fontSize": 28,
        "_fontFamily": "Arial",
        "_lineHeight": 33.6,
        "_overflow": 0,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_cacheMode": 0,
        "_color": {"__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255},
        "_id": "93a8a6e7f8f542cea79980bc8e8e3036"
    })
    
    # 5: currentRankLabel node
    prefab.append({
        "__id__": 5,
        "__type__": "cc.Node",
        "_name": "currentRankLabel",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 6},
            {"__id__": 7}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": -200, "y": 210, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "cr_label_node"
    })
    
    # 6: currentRankLabel UITransform
    prefab.append({
        "__id__": 6,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 5},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 200, "height": 24},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "cr_label_ut"
    })
    
    # 7: currentRankLabel Label
    prefab.append({
        "__id__": 7,
        "__type__": "cc.Label",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 5},
        "_enabled": True,
        "__prefab": None,
        "_useOriginalSize": False,
        "_string": "我的排名: --",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 16,
        "_fontSize": 16,
        "_fontFamily": "Arial",
        "_lineHeight": 19.2,
        "_overflow": 0,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_cacheMode": 0,
        "_color": {"__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255},
        "_id": "cr_label_comp"
    })
    
    # 8: currentScoreLabel node
    prefab.append({
        "__id__": 8,
        "__type__": "cc.Node",
        "_name": "currentScoreLabel",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 9},
            {"__id__": 10}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 200, "y": 210, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "cs_label_node"
    })
    
    # 9: currentScoreLabel UITransform
    prefab.append({
        "__id__": 9,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 8},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 200, "height": 24},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "cs_label_ut"
    })
    
    # 10: currentScoreLabel Label
    prefab.append({
        "__id__": 10,
        "__type__": "cc.Label",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 8},
        "_enabled": True,
        "__prefab": None,
        "_useOriginalSize": False,
        "_string": "我的得分: --",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 16,
        "_fontSize": 16,
        "_fontFamily": "Arial",
        "_lineHeight": 19.2,
        "_overflow": 0,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_cacheMode": 0,
        "_color": {"__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255},
        "_id": "cs_label_comp"
    })
    
    # 11: levelFilterNode
    prefab.append({
        "__id__": 11,
        "__type__": "cc.Node",
        "_name": "levelFilterNode",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 12}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 180, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "level_filter_node"
    })
    
    # 12: levelFilterNode UITransform
    prefab.append({
        "__id__": 12,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 11},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 300, "height": 36},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "level_filter_ut"
    })
    
    # 13: leaderboardScrollView node
    prefab.append({
        "__id__": 13,
        "__type__": "cc.Node",
        "_name": "leaderboardScrollView",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [
            {"__id__": 16}
        ],
        "_active": True,
        "_components": [
            {"__id__": 14},
            {"__id__": 15}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": -30, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "scroll_view_node"
    })
    
    # 14: leaderboardScrollView UITransform
    prefab.append({
        "__id__": 14,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 13},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 600, "height": 380},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "scroll_view_ut"
    })
    
    # 15: leaderboardScrollView ScrollView component
    prefab.append({
        "__id__": 15,
        "__type__": "cc.ScrollView",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 13},
        "_enabled": True,
        "__prefab": None,
        "_content": {"__id__": 16},
        "_horizontal": False,
        "_vertical": True,
        "_inertia": True,
        "_elastic": True,
        "_bounceDuration": 1,
        "_scrollEvents": [],
        "_id": "scroll_view_comp"
    })
    
    # 16: leaderboardContainer node
    prefab.append({
        "__id__": 16,
        "__type__": "cc.Node",
        "_name": "leaderboardContainer",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 13},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 17}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "8c10fca9"
    })
    
    # 17: leaderboardContainer UITransform
    prefab.append({
        "__id__": 17,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 16},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 600, "height": 380},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "5efe6e91d69e40ef85b5f88723728d20"
    })
    
    # 18: backButton node
    prefab.append({
        "__id__": 18,
        "__type__": "cc.Node",
        "_name": "backButton",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 0},
        "_children": [],
        "_active": True,
        "_components": [
            {"__id__": 19},
            {"__id__": 20},
            {"__id__": 21}
        ],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": -240, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "1568d6ce"
    })
    
    # 19: backButton UITransform
    prefab.append({
        "__id__": 19,
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 18},
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": 160, "height": 44},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "c51c50c5a4dc419492423aac4fc5a7ab"
    })
    
    # 20: backButton Button
    prefab.append({
        "__id__": 20,
        "__type__": "cc.Button",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 18},
        "_enabled": True,
        "__prefab": None,
        "clickEvents": [],
        "_interactable": True,
        "_transition": 2,
        "_normalColor": {"__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255},
        "_pressedColor": {"__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255},
        "_hoverColor": {"__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255},
        "_disabledColor": {"__type__": "cc.Color", "r": 124, "g": 124, "b": 124, "a": 255},
        "_duration": 0.1,
        "_zoomScale": 1.2,
        "_target": None,
        "_id": "71e833404c8f435f876aa05872561e65"
    })
    
    # 21: backButton Label
    prefab.append({
        "__id__": 21,
        "__type__": "cc.Label",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 18},
        "_enabled": True,
        "__prefab": None,
        "_useOriginalSize": False,
        "_string": "返回",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 16,
        "_fontSize": 16,
        "_fontFamily": "Arial",
        "_lineHeight": 19.2,
        "_overflow": 0,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_cacheMode": 0,
        "_color": {"__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255},
        "_id": "43ca36c9afbf48639e83e2cf7fd45f8b"
    })
    
    # 22: LeaderboardPanel Script
    prefab.append({
        "__id__": 22,
        "__type__": "cc.Script",
        "name": "LeaderboardPanel",
        "_name": "",
        "_objFlags": 0,
        "node": {"__id__": 0},
        "_enabled": True,
        "__prefab": None,
        "__scriptAsset": {
            "__uuid__": "5a399a13f5aee1bd0aa10a2c1cc49dbb",
            "__expectedType__": "cc.Component"
        },
        "_id": "ed6796f99127405787746d04b8f380d9",
        "leaderboardScrollView": {"__id__": 15},
        "leaderboardContainer": {"__id__": 16},
        "levelFilterNode": {"__id__": 11},
        "currentRankLabel": {"__id__": 7},
        "currentScoreLabel": {"__id__": 10}
    })
    
    for obj in prefab:
        if obj.get('__type__') != 'cc.Node':
            obj['node'] = None
    
    return prefab

def main():
    prefab_path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'LeaderboardPanel.prefab')
    prefab_data = generate_leaderboard_prefab()
    
    print(f'生成 LeaderboardPanel.prefab:')
    print(f'  对象总数: {len(prefab_data)}')
    print(f'  属性引用:')
    script_obj = prefab_data[22]
    for key in ['leaderboardScrollView', 'leaderboardContainer', 'levelFilterNode', 'currentRankLabel', 'currentScoreLabel']:
        ref = script_obj[key]
        if isinstance(ref, dict) and '__id__' in ref:
            target_obj = prefab_data[ref['__id__']]
            target_type = target_obj.get('__type__', '?')
            target_name = target_obj.get('_name', '')
            print(f'    {key} -> __id__:{ref["__id__"]} ({target_type}, name={target_name})')
        else:
            print(f'    {key} -> null')
    
    with open(prefab_path, 'w') as f:
        json.dump(prefab_data, f, ensure_ascii=False, indent=2)
    
    print(f'\n✅ 已保存到 {prefab_path}')
    return len(prefab_data)

if __name__ == '__main__':
    main()
