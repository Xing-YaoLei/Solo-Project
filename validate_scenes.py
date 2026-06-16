import json

scene_files = [
    ('assets/scenes/MainMenu.scene', 'MainMenu', ['a1b2c3d4e5f67890abcdef1234567801']),
    ('assets/scenes/LevelSelect.scene', 'LevelSelect', ['a1b2c3d4e5f67890abcdef1234567802']),
    ('assets/scenes/Game.scene', 'Game', ['a1b2c3d4e5f67890abcdef1234567803','a1b2c3d4e5f67890abcdef1234567805','a1b2c3d4e5f67890abcdef1234567806','a1b2c3d4e5f67890abcdef1234567807','a1b2c3d4e5f67890abcdef1234567808']),
    ('assets/scenes/Result.scene', 'Result', ['a1b2c3d4e5f67890abcdef1234567804']),
]

all_ok = True
for path, name, expected_scripts in scene_files:
    with open(path) as f:
        data = json.load(f)
    if data[0]['__type__'] != 'cc.Scene':
        print(f'FAIL {path}: root is not cc.Scene')
        all_ok = False
        continue
    if data[0]['_name'] != name:
        print(f'FAIL {path}: scene name mismatch, got {data[0]["_name"]}')
        all_ok = False
    canvas = data[1]
    if canvas['__type__'] != 'cc.Node' or canvas['_name'] != 'Canvas':
        print(f'FAIL {path}: Canvas node missing')
        all_ok = False
    uitransform = data[2]
    if uitransform['__type__'] != 'cc.UITransform':
        print(f'FAIL {path}: UITransform missing')
        all_ok = False
    script_types = [data[comp['__id__']]['__type__'] for comp in canvas['_components'] if data[comp['__id__']]['__type__'] != 'cc.UITransform']
    for st in expected_scripts:
        if st not in script_types:
            print(f'FAIL {path}: missing script {st}')
            all_ok = False
    globals_id = data[0]['_globals']['__id__']
    if data[globals_id]['__type__'] != 'cc.SceneGlobals':
        print(f'FAIL {path}: _globals does not point to SceneGlobals (points to index {globals_id} which is {data[globals_id]["__type__"]})')
        all_ok = False
    else:
        ambient_id = data[globals_id]['ambient']['__id__']
        if data[ambient_id]['__type__'] != 'cc.AmbientInfo':
            print(f'FAIL {path}: ambient does not point to AmbientInfo')
            all_ok = False
    print(f'OK {path}: {len(data)} nodes, scripts={script_types}')

if all_ok:
    print('\nAll scene files validated successfully!')
else:
    print('\nSome validations failed!')
