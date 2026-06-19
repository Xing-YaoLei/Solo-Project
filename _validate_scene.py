import json

with open('assets/scenes/main.scene') as f:
    scene = json.load(f)

print("=== 场景文件关键绑定验证 ===")
obj_map = {o['__id__']: o for o in scene}
all_ok = True

lsc = None
canvas = None
for o in scene:
    if o.get('__type__') == 'LevelSceneController':
        lsc = o
    if o.get('__type__') == 'cc.Node' and o.get('_name') == 'Canvas':
        canvas = o

if lsc:
    print(f"✅ LevelSceneController 存在: __id__={lsc['__id__']}")
    print(f"   属性绑定:")
    bind_fields = ['mapRoot','hudRoot','timerLabel','scoreLabel','accuracyLabel','diagnosisDescLabel',
                  'photoPrevBtn','photoNextBtn','photoIndexLabel','inspectionPhotoNode',
                  'quotesContainer','quoteDropZoneNode','diagnosisTabBar','settlementRoot',
                  'settlementComponent','reviewRoot','reviewComponent','eventPopupRoot','pauseBtn']
    for field in bind_fields:
        val = lsc.get(field)
        if val and isinstance(val, dict) and '__id__' in val:
            target_id = val['__id__']
            target = obj_map.get(target_id, {})
            target_type = target.get('__type__', '?')
            target_name = target.get('_name', '?')
            print(f"   ✅ {field:25s} -> __id__={target_id:3d} [{target_type}] '{target_name}'")
        else:
            print(f"   ❌ {field:25s} -> 未绑定或格式错误: {val}")
            all_ok = False
    if '__scriptAsset' in lsc:
        print(f"   ✅ __scriptAsset: {lsc['__scriptAsset']}")
    else:
        print(f"   ❌ 缺少 __scriptAsset")
        all_ok = False
else:
    print("❌ LevelSceneController 未找到")
    all_ok = False

ge = next((o for o in scene if o.get('__type__') == 'GameEntrance'), None)
if ge:
    print(f"\n✅ GameEntrance 存在: __id__={ge['__id__']}")
    if '__scriptAsset' in ge:
        print(f"   ✅ __scriptAsset: {ge['__scriptAsset']}")
    else:
        print(f"   ❌ 缺少 __scriptAsset")
        all_ok = False
else:
    print("\n❌ GameEntrance 未找到")
    all_ok = False

tm = next((o for o in scene if o.get('__type__') == 'cc.TiledMap'), None)
if tm:
    print(f"\n✅ cc.TiledMap 存在: __id__={tm['__id__']}")
    if 'tmxAsset' in tm:
        print(f"   ✅ tmxAsset: {tm['tmxAsset']}")
    else:
        print(f"   ❌ 缺少 tmxAsset")
        all_ok = False
else:
    print("\n❌ cc.TiledMap 未找到")
    all_ok = False

if canvas and '_components' in canvas:
    comp_ids = [c['__id__'] for c in canvas['_components']]
    comp_types = [obj_map.get(cid, {}).get('__type__', '?') for cid in comp_ids]
    print(f"\n✅ Canvas 组件: {comp_types}")
    if 'GameEntrance' in comp_types and 'LevelSceneController' in comp_types:
        print(f"   ✅ 已挂载 GameEntrance + LevelSceneController")
    else:
        print(f"   ❌ 缺少 GameEntrance 或 LevelSceneController")
        all_ok = False

for o in scene:
    if o.get('_name') in ['SettlementRoot', 'ReviewRoot']:
        active = o.get('_active', True)
        print(f"\n✅ {o['_name']} initial _active: {active}")
        if active:
            print(f"   ⚠️  警告：初始为激活状态，应为false")

if all_ok:
    print(f"\n✅ 场景文件所有关键绑定通过验证！")
else:
    print(f"\n❌ 场景文件存在问题，请检查")
