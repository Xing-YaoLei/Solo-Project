#!/usr/bin/env python3
"""修复所有 Prefab 和场景文件中的 __scriptAsset UUID"""
import os
import json
import glob

UUID_MAP = {
    'ConfigManager': 'bd4c6968ce2223ecba5485688e9ba608',
    'GameManager': '4c199a5a5b39bc9765423ccdf48a00b9',
    'SaveManager': '17fcb9cf8742666cea7862e5271307ad',
    'TrainingRecordManager': '25018697522e47ae7afbbd03274b5dc7',
    'GameBootstrap': '8cc8f3be84ca47a73f78b697ebaf3136',
    'MainScene': '8416c6ebcbae53e1ba01c85aa37f62b2',
    'InteractiveObjectHandler': '936a0414d14687d7ddda926ea300148a',
    'NPCHandler': '24b2232e07447a91e78ea4ee2e1b353a',
    'SceneController': '6d22639d681dcb82dfb811999ec65884',
    'GameTestSuite': '3fd13807fad666aa9349d7c0b73ebf37',
    'TestRunner': 'a0290d365427b71ce95d26f90224ba9b',
    'ActionPanel': '5e7e778e3684ff4b2b10d687d398ac24',
    'CluePanel': '7a6692d5719231fa7c43a368f7475be1',
    'HUDController': '57ced632961c46955b8fef0a76510871',
    'LeaderboardPanel': '5a399a13f5aee1bd0aa10a2c1cc49dbb',
    'LevelSelectPanel': '8f7aa51280dd56f4005416bf7dcfbfdf',
    'SettlementPanel': '2303bcef1982c401b944354739911bf3',
    'TaskPanel': 'f2b4dc448677cab8f0fbe363cdd95dd9',
    'TutorialController': '900f68ff023c4e59d7e5b66b561410d2',
    'UIController': 'e9a5dbce3b97961bdc6d75442250ffb5'
}

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFAB_DIR = os.path.join(BASE, 'assets', 'resources', 'prefabs')
SCENE_DIR = os.path.join(BASE, 'assets', 'scenes')

files = sorted(glob.glob(os.path.join(PREFAB_DIR, '*.prefab'))) + [
    os.path.join(SCENE_DIR, 'MainScene.scene')
]

total = 0
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = False
    for obj in data:
        if obj.get('__type__') == 'cc.Script':
            name = obj.get('name', '')
            if name in UUID_MAP:
                sa = obj.get('__scriptAsset')
                if isinstance(sa, dict) and '__uuid__' in sa:
                    old = sa['__uuid__']
                    new = UUID_MAP[name]
                    if old != new:
                        sa['__uuid__'] = new
                        updated = True
                        print(f'{os.path.basename(fpath)}: {name} {old[:8]} → {new[:8]}')
    
    if updated:
        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        total += 1

print(f'\n✅ 更新了 {total} 个文件')
