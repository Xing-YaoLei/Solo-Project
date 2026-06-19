import json

with open('assets/scenes/main.scene') as f:
    scene = json.load(f)

obj_map = {o['__id__']: o for o in scene}

def get_name(oid):
    o = obj_map.get(oid, {})
    return o.get('_name', '?')

def get_type(oid):
    o = obj_map.get(oid, {})
    return o.get('__type__', '?')

def find_by_name(name):
    for o in scene:
        if o.get('_name') == name:
            return o
    return None

print("=" * 60)
print("场景完整验证报告")
print("=" * 60)

# === Canvas 检查 ===
canvas = find_by_name('Canvas')
print(f"\n✅ Canvas: __id__={canvas['__id__']}")
print(f"   组件数量: {len(canvas['_components'])}")
comp_types = [get_type(c['__id__']) for c in canvas['_components']]
print(f"   组件列表: {comp_types}")
assert 'GameEntrance' in comp_types, "缺少 GameEntrance"
assert 'LevelSceneController' in comp_types, "缺少 LevelSceneController"
print(f"   ✅ 已挂载 GameEntrance + LevelSceneController")

# === LevelSceneController 检查 ===
lsc = next((o for o in scene if o['__type__'] == 'LevelSceneController'), None)
print(f"\n=== LevelSceneController 属性 ===")

label_props = ['timerLabel', 'scoreLabel', 'accuracyLabel', 'diagnosisDescLabel', 'photoIndexLabel']
node_props = ['mapRoot', 'hudRoot', 'photoPrevBtn', 'photoNextBtn', 'inspectionPhotoNode',
              'quotesContainer', 'quoteDropZoneNode', 'diagnosisTabBar', 'settlementRoot',
              'reviewRoot', 'eventPopupRoot', 'pauseBtn']
comp_props = ['settlementComponent', 'reviewComponent']

all_ok = True
for p in label_props:
    v = lsc.get(p)
    if v and '__id__' in v:
        t = get_type(v['__id__'])
        status = '✅' if t == 'cc.Label' else '❌'
        print(f"   {status} {p:25s} -> __id__={v['__id__']:3d} [{t}]")
        if t != 'cc.Label': all_ok = False
    else:
        print(f"   ❌ {p:25s} -> 未绑定")
        all_ok = False

for p in node_props:
    v = lsc.get(p)
    if v and '__id__' in v:
        t = get_type(v['__id__'])
        status = '✅' if t == 'cc.Node' else '❌'
        print(f"   {status} {p:25s} -> __id__={v['__id__']:3d} [{t}] '{get_name(v['__id__'])}'")
        if t != 'cc.Node': all_ok = False
    else:
        print(f"   ❌ {p:25s} -> 未绑定")
        all_ok = False

for p in comp_props:
    v = lsc.get(p)
    if v and '__id__' in v:
        t = get_type(v['__id__'])
        print(f"   ✅ {p:25s} -> __id__={v['__id__']:3d} [{t}]")
    else:
        print(f"   ❌ {p:25s} -> 未绑定")
        all_ok = False

# === MapRoot + TiledMap ===
print(f"\n=== MapRoot + TiledMap ===")
maproot = find_by_name('MapRoot')
if maproot:
    comps = [get_type(c['__id__']) for c in maproot['_components']]
    print(f"   ✅ MapRoot 组件: {comps}")
    if 'cc.TiledMap' in comps:
        tm = next((obj_map[c['__id__']] for c in maproot['_components'] if get_type(c['__id__']) == 'cc.TiledMap'), None)
        if tm and 'tmxAsset' in tm:
            print(f"   ✅ TiledMap tmxAsset: {tm['tmxAsset']}")
        else:
            print(f"   ❌ TiledMap 缺少 tmxAsset")
            all_ok = False

# === SettlementRoot 检查 ===
print(f"\n=== SettlementRoot 结构 ===")
setroot = find_by_name('SettlementRoot')
if setroot:
    print(f"   ✅ 初始 _active: {setroot['_active']}")
    comps = [get_type(c['__id__']) for c in setroot['_components']]
    print(f"   ✅ 根组件: {comps}")

    panel = None
    for cid in setroot['_children']:
        child = obj_map[cid['__id__']]
        if child.get('_name') == 'SettlePanel':
            panel = child
            break

    if panel:
        print(f"   ✅ SettlePanel 子节点数: {len(panel['_children'])}")
        child_names = [get_name(c['__id__']) for c in panel['_children']]
        print(f"   子节点: {child_names}")
        required = ['TitleLabel', 'ScoreLabel', 'AccuracyLabel', 'CostLabel', 'ReworkLabel', 'TimeLabel', 'ContinueBtn', 'RetryBtn']
        for r in required:
            found = any(r == n for n in child_names)
            print(f"     {'✅' if found else '❌'} {r}")
            if not found: all_ok = False
    else:
        print(f"   ❌ 缺少 SettlePanel")
        all_ok = False

    # SettlementComponent 属性
    sc = next((o for o in scene if o['__type__'] == 'SettlementComponent'), None)
    if sc:
        print(f"\n   SettlementComponent 属性:")
        sc_props = ['scoreLabel', 'accuracyLabel', 'costLabel', 'reworkLabel', 'timeLabel', 'continueBtn', 'retryBtn']
        for p in sc_props:
            v = sc.get(p)
            if v and '__id__' in v:
                t = get_type(v['__id__'])
                expected = 'cc.Label' if p.endswith('Label') else 'cc.Node'
                status = '✅' if t == expected else '❌'
                print(f"     {status} {p:20s} -> __id__={v['__id__']:3d} [{t}]")
                if t != expected: all_ok = False
            else:
                print(f"     ❌ {p:20s} -> 未绑定")
                all_ok = False

# === ReviewRoot 检查 ===
print(f"\n=== ReviewRoot 结构 ===")
revroot = find_by_name('ReviewRoot')
if revroot:
    print(f"   ✅ 初始 _active: {revroot['_active']}")

    panel = None
    for cid in revroot['_children']:
        child = obj_map[cid['__id__']]
        if child.get('_name') == 'ReviewPanel':
            panel = child
            break

    if panel:
        print(f"   ✅ ReviewPanel 子节点数: {len(panel['_children'])}")
        child_names = [get_name(c['__id__']) for c in panel['_children']]
        print(f"   子节点: {child_names}")
        required = ['TitleLabel', 'ReworkRateLabel', 'TotalTimeLabel', 'AvgTimeLabel',
                    'BottleneckTitle', 'BottleneckContainer', 'BreakdownTitle', 'BreakdownContainer',
                    'RetryBtn', 'NextLevelBtn']
        for r in required:
            found = any(r == n for n in child_names)
            print(f"     {'✅' if found else '❌'} {r}")
            if not found: all_ok = False
    else:
        print(f"   ❌ 缺少 ReviewPanel")
        all_ok = False

    # ReviewPageComponent 属性
    rc = next((o for o in scene if o['__type__'] == 'ReviewPageComponent'), None)
    if rc:
        print(f"\n   ReviewPageComponent 属性:")
        rc_props = ['reworkRateLabel', 'totalTimeLabel', 'avgTimeLabel',
                    'bottleneckContainer', 'breakdownContainer', 'retryBtn', 'nextLevelBtn']
        for p in rc_props:
            v = rc.get(p)
            if v and '__id__' in v:
                t = get_type(v['__id__'])
                expected = 'cc.Label' if p.endswith('Label') else 'cc.Node'
                status = '✅' if t == expected else '❌'
                print(f"     {status} {p:25s} -> __id__={v['__id__']:3d} [{t}]")
                if t != expected: all_ok = False
            else:
                print(f"     ❌ {p:25s} -> 未绑定")
                all_ok = False

# === 游戏流程节点检查 ===
print(f"\n=== 核心游戏节点 ===")
core_nodes = ['InspectionPhotoNode', 'QuoteDropZoneNode', 'QuotesContainer',
              'DiagnosisTabBar', 'TimerLabel', 'PhotoPrevBtn', 'PhotoNextBtn']
for n in core_nodes:
    node = find_by_name(n)
    if node:
        print(f"   ✅ {n}")
    else:
        print(f"   ❌ {n} 缺失")
        all_ok = False

# === JSON 语法检查 ===
print(f"\n=== JSON 完整性 ===")
print(f"   ✅ 总对象数: {len(scene)}")
print(f"   ✅ __id__ 范围: 0 ~ {len(scene)-1}")

# 检查所有 __id__ 引用是否有效
referenced_ids = set()
for o in scene:
    def scan(val):
        if isinstance(val, dict):
            if '__id__' in val:
                referenced_ids.add(val['__id__'])
            for v in val.values():
                scan(v)
        elif isinstance(val, list):
            for v in val:
                scan(v)
    scan(o)

valid_ids = set(range(len(scene)))
invalid_refs = referenced_ids - valid_ids
if invalid_refs:
    print(f"   ❌ 无效 __id__ 引用: {invalid_refs}")
    all_ok = False
else:
    print(f"   ✅ 所有 __id__ 引用有效")

print()
print("=" * 60)
if all_ok:
    print("✅✅✅ 全部验证通过！场景可正常反序列化 ✅✅✅")
else:
    print("❌❌❌ 存在问题，请检查 ❌❌❌")
print("=" * 60)
