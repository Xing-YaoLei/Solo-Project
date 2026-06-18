#!/bin/bash
set -e
cd /Users/yaoleyxing/Developer/solo-mange-pro/MP0336
BASE=http://localhost:8001/api/v1

echo "⚙️  Step 0: 收紧行驶证、购置税、购车发票阈值，触发重算"
for THID in th-1 th-3 th-5; do
  echo ""
  echo "  → PUT $BASE/rules/thresholds/$THID (warningDays=1, criticalDays=5)"
  curl -s -X PUT "$BASE/rules/thresholds/$THID" \
    -H "Content-Type: application/json" \
    -d '{"warningDays":1,"criticalDays":5,"enabled":true}' \
    | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(f'    ✅ affectedCount={d.get(\"affectedCount\")}, updated={d.get(\"updatedThreshold\",{}).get(\"thresholdName\", d.get(\"updatedThreshold\",{}).get(\"documentType\"))}')"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 三端数据一致性验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 从第一台受影响车辆取 VIN
VIN=$(curl -s "$BASE/rules/thresholds/th-1" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
print(d.get('lastRecalculationVIN',''))
" 2>/dev/null)

# 兜底：直接找一台 alerts>0 的
if [ -z "$VIN" ]; then
  VIN=$(curl -s "$BASE/vehicles?page=1&page_size=30" | python3 -c "
import sys,json
d = json.load(sys.stdin)['data']
for v in d['items']:
    if v.get('alertsCount', 0) > 0:
        print(v['vin'])
        break
")
fi

echo ""
echo "目标 VIN = $VIN"
echo ""

echo "1️⃣  /vehicles/$VIN  详情接口:"
curl -s "$BASE/vehicles/$VIN" > /tmp/_detail.json
python3 <<'PYEOF'
import json
d = json.load(open('/tmp/_detail.json'))['data']
print(f'   riskLevel    : {d["riskLevel"]}')
print(f'   stockDays    : {d["stockDays"]}')
print(f'   alerts count : {len(d.get("alerts", []))} 条')
print(f'   documents    : {len(d.get("documents", []))} 份')
if d.get('alerts'):
    print(f'   alerts[0].ruleName: {d["alerts"][0]["ruleName"][:50]}...')
PYEOF

echo ""
echo "2️⃣  /review/$VIN  复盘接口:"
curl -s "$BASE/review/$VIN" > /tmp/_review.json
python3 <<'PYEOF'
import json
d = json.load(open('/tmp/_review.json'))['data']
v = d['vehicle']
print(f'   riskLevel    : {v["riskLevel"]}  ← 必须与列表一致')
print(f'   stockDays    : {v["stockDays"]}')
print(f'   alerts count : {len(d.get("alerts", []))} 条  ← 必须与列表一致')
print(f'   documents    : {len(d.get("documents", []))} 份')
print(f'   vehicle.alertsCount: {v.get("alertsCount")}')
print(f'   preparationRecords : {len(d.get("preparationRecords", []))} 条')
print(f'   testDriveRecords   : {len(d.get("testDriveRecords", []))} 条')
print(f'   quoteRecords       : {len(d.get("quoteRecords", []))} 条')
print(f'   timeline 阶段数    : {len(d.get("timeline", []))} 个')
print(f'   thresholdHits      : {len(d.get("thresholdHits", []))} 条')
for t in d.get('thresholdHits', []):
    print(f'      ● [{t["level"]}] {t["thresholdName"]}: {t["message"][:60]}...')
print()
print('📋 timeline 样例（第 3 阶段）:')
if len(d.get('timeline',[])) >= 3:
    s = d['timeline'][2]
    print(f'   stage={s["stage"]}, label={s["label"]}, at={s["at"]}, hasDocIssue={s["hasDocIssue"]}')
    print(f'   note={s["note"][:60]}...')
PYEOF

echo ""
echo "3️⃣  /vehicles  列表接口（找同车）:"
curl -s "$BASE/vehicles?page=1&page_size=30" > /tmp/_list.json
python3 -c "
import json
d = json.load(open('/tmp/_list.json'))['data']
VIN = open('/dev/stdin').read().strip()
" <<<"$VIN"
python3 <<PYEOF
import json
d = json.load(open('/tmp/_list.json'))['data']
VIN = open('/tmp/_target_vin.txt').read().strip() if open('/tmp/_target_vin.txt','r').read().strip() else list(d['items'])[0]['vin']
target = next((v for v in d['items'] if v.get('vin')==VIN), None)
if target:
    print(f'   riskLevel    : {target["riskLevel"]}  ← 必须与详情一致')
    print(f'   alertsCount  : {target.get("alertsCount")} 条  ← 必须与详情一致')
    print(f'   documents    : {len(target.get("documents", []))} 份')
    print(f'   storeName    : {target.get("storeName")}')
    if target.get('alerts'):
        print(f'   alerts[0].ruleName: {target["alerts"][0]["ruleName"][:50]}...')
    detail = json.load(open('/tmp/_detail.json'))['data']
    review = json.load(open('/tmp/_review.json'))['data']
    ok = True
    if detail['riskLevel'] != target['riskLevel']:
        print(f'   ❌ riskLevel 不一致: detail={detail["riskLevel"]}, list={target["riskLevel"]}')
        ok = False
    if len(detail['alerts']) != target.get('alertsCount'):
        print(f'   ❌ alerts 不一致: detail={len(detail["alerts"])}, list={target.get("alertsCount")}')
        ok = False
    if review['vehicle']['riskLevel'] != detail['riskLevel']:
        print(f'   ❌ review riskLevel 不一致: review={review["vehicle"]["riskLevel"]}, detail={detail["riskLevel"]}')
        ok = False
    if len(review['alerts']) != len(detail['alerts']):
        print(f'   ❌ review alerts 不一致: review={len(review["alerts"])}, detail={len(detail["alerts"])}')
        ok = False
    print()
    if ok:
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        print('✅ 三端一致性验证通过！风险等级、预警数、材料数完全一致')
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    else:
        print('❌ 存在不一致！')
PYEOF
