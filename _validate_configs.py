import json

with open('assets/resources/config/levels.json') as f:
    levels = json.load(f)
with open('assets/resources/config/diagnoses.json') as f:
    diagnoses = json.load(f)
with open('assets/resources/config/events.json') as f:
    events = json.load(f)

print("=== 配置一致性验证 ===")
all_diag_ids = set(diagnoses.keys())
all_event_ids = set(events.keys())
all_ok = True

for lid, lcfg in levels.items():
    req_fields = ['id','name','difficulty','timeLimit','diagnosisIds','eventIds','scoringRule','requiredAccuracy']
    missing = [f for f in req_fields if f not in lcfg]
    if missing:
        print(f"❌ Level {lid} 缺少: {missing}")
        all_ok = False
    bad_diag = [d for d in lcfg['diagnosisIds'] if d not in all_diag_ids]
    bad_event = [e for e in lcfg['eventIds'] if e not in all_event_ids]
    if bad_diag or bad_event:
        print(f"❌ Level {lid} 引用不存在: diag={bad_diag}, event={bad_event}")
        all_ok = False
    if 'baseScore' not in lcfg.get('scoringRule',{}):
        print(f"❌ Level {lid} scoringRule缺少baseScore")
        all_ok = False

for did, dcfg in diagnoses.items():
    req_fields = ['id','description','photoPaths','correctQuoteId','quoteOptions','severityLevel','reworkRisk']
    missing = [f for f in req_fields if f not in dcfg]
    if missing:
        print(f"❌ Diagnosis {did} 缺少: {missing}")
        all_ok = False
    bad_paths = [p for p in dcfg['photoPaths'] if not p.startswith('textures/')]
    if bad_paths:
        print(f"❌ Diagnosis {did} 路径缺少textures前缀: {bad_paths}")
        all_ok = False
    opt_ids = [o['id'] for o in dcfg['quoteOptions']]
    if dcfg['correctQuoteId'] not in opt_ids:
        print(f"❌ Diagnosis {did} correctQuoteId不在options中: {dcfg['correctQuoteId']} 不在 {opt_ids}")
        all_ok = False

for eid, ecfg in events.items():
    req_fields = ['id','type','triggerCondition','partsAffected','resolutionOptions','impactScore']
    missing = [f for f in req_fields if f not in ecfg]
    if missing:
        print(f"❌ Event {eid} 缺少: {missing}")
        all_ok = False

if all_ok:
    print(f"\n✅ 所有配置通过验证！")
    print(f"   关卡数: {len(levels)}, 诊断数: {len(diagnoses)}, 事件数: {len(events)}")
else:
    print(f"\n❌ 存在配置错误，请修复")
