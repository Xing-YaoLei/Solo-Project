#!/usr/bin/env python3
"""修复 Prefab 中的 active 状态"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def fix_uicontroller():
    path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'UIController.prefab')
    with open(path, 'r') as f:
        data = json.load(f)
    for obj in data:
        name = obj.get('_name', '')
        if name in ('gameplayRoot', 'settlementRoot', 'leaderboardRoot'):
            obj['_active'] = False
            print(f'  UIController: {name} active=false')
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fix_settlement_panel():
    path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'SettlementPanel.prefab')
    with open(path, 'r') as f:
        data = json.load(f)
    for obj in data:
        name = obj.get('_name', '')
        if name == 'nursingLogPanel':
            obj['_active'] = True
            print(f'  SettlementPanel: {name} active=true')
        elif name == 'billingDetailPanel':
            obj['_active'] = False
            print(f'  SettlementPanel: {name} active=false')
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fix_action_panel():
    path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'ActionPanel.prefab')
    with open(path, 'r') as f:
        data = json.load(f)
    for obj in data:
        name = obj.get('_name', '')
        if name in ('feedbackSection', 'proceedButton'):
            obj['_active'] = False
            print(f'  ActionPanel: {name} active=false')
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fix_clue_panel():
    path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'CluePanel.prefab')
    with open(path, 'r') as f:
        data = json.load(f)
    for obj in data:
        name = obj.get('_name', '')
        # CluePanel 默认不显示，由 UIController 切换 Tab 时显示
        pass
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    print('修复 Prefab active 状态:')
    fix_uicontroller()
    fix_settlement_panel()
    fix_action_panel()
    fix_clue_panel()
    print('✅ 完成')
