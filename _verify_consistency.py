#!/usr/bin/env python3
import json, urllib.request

BASE = 'http://localhost:8001/api/v1'

def req(method, path, data=None):
    body = None
    headers = {"Content-Type": "application/json"}
    if data is not None:
        body = json.dumps(data).encode()
    r = urllib.request.Request(BASE + path, data=body, method=method, headers=headers)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read())['data']

print('Step 0: tighten thresholds to trigger recalculation')
for thid in ['th-1', 'th-3', 'th-5']:
    result = req('PUT', f'/rules/thresholds/{thid}', {"warningDays":1,"criticalDays":5,"enabled":True})
    th_name = result.get('updatedThreshold',{}).get('documentType') or result.get('updatedThreshold',{}).get('thresholdName') or thid
    print(f'  -> {th_name}: affectedCount={result.get("affectedCount")}')

print()
print('='*60)
print('Cross-endpoint consistency check')
print('='*60)

list_data = req('GET', '/vehicles?page=1&page_size=30')
target = None
for v in list_data['items']:
    if v.get('alertsCount', 0) > 0:
        target = v
        break
VIN = target['vin']

print(f'Target VIN = {VIN}')
print()

detail = req('GET', f'/vehicles/{VIN}')
review = req('GET', f'/review/{VIN}')

print('1) /vehicles/<vin> detail endpoint:')
print(f'   riskLevel    : {detail["riskLevel"]}')
print(f'   stockDays    : {detail["stockDays"]}')
print(f'   alerts count : {len(detail.get("alerts", []))}')
print(f'   documents    : {len(detail.get("documents", []))}')
if detail.get('alerts'):
    print(f'   alerts[0] ruleName: {detail["alerts"][0]["ruleName"][:50]}')

print()
print('2) /review/<vin> unified review package:')
rv = review['vehicle']
print(f'   riskLevel    : {rv["riskLevel"]}')
print(f'   stockDays    : {rv["stockDays"]}')
print(f'   alerts count : {len(review.get("alerts", []))}')
print(f'   documents    : {len(review.get("documents", []))}')
print(f'   alertsCount in vehicle: {rv.get("alertsCount")}')
print(f'   preparationRecords : {len(review.get("preparationRecords", []))} items')
print(f'   testDriveRecords   : {len(review.get("testDriveRecords", []))} items')
print(f'   quoteRecords       : {len(review.get("quoteRecords", []))} items')
print(f'   timeline stages    : {len(review.get("timeline", []))} stages')
print(f'   thresholdHits      : {len(review.get("thresholdHits", []))} rules')
for t in review.get('thresholdHits', []):
    print(f'     * [{t["level"]}] {t["thresholdName"]}: {t["message"][:60]}')
print()
print('timeline sample (stage #3):')
if len(review.get('timeline', [])) >= 3:
    s = review['timeline'][2]
    print(f'   stage={s["stage"]}, label={s["label"]}, at={s["at"]}, hasDocIssue={s["hasDocIssue"]}')
    print(f'   note={s["note"][:60]}')

print()
print('3) /vehicles list endpoint (same car):')
print(f'   riskLevel    : {target["riskLevel"]}')
print(f'   alertsCount  : {target.get("alertsCount")}')
print(f'   documents    : {len(target.get("documents", []))}')
print(f'   storeName    : {target.get("storeName")}')
if target.get('alerts'):
    print(f'   alerts[0] ruleName: {target["alerts"][0]["ruleName"][:50]}')

print()
ok = True
if detail['riskLevel'] != target['riskLevel']:
    print(f'FAIL: riskLevel mismatch detail={detail["riskLevel"]} vs list={target["riskLevel"]}')
    ok = False
if len(detail['alerts']) != target.get('alertsCount'):
    print(f'FAIL: alerts count mismatch detail={len(detail["alerts"])} vs list={target.get("alertsCount")}')
    ok = False
if rv['riskLevel'] != detail['riskLevel']:
    print(f'FAIL: review riskLevel mismatch review={rv["riskLevel"]} vs detail={detail["riskLevel"]}')
    ok = False
if len(review['alerts']) != len(detail['alerts']):
    print(f'FAIL: review alerts count mismatch review={len(review["alerts"])} vs detail={len(detail["alerts"])}')
    ok = False
if len(review.get('thresholdHits', [])) < 1:
    print('FAIL: thresholdHits should be non-empty object array')
    ok = False
if not all(isinstance(th, dict) and 'thresholdId' in th for th in review.get('thresholdHits', [])):
    print('FAIL: thresholdHits items must be dicts with thresholdId')
    ok = False

print()
if ok:
    print('='*60)
    print('PASS: All three endpoints return consistent data.')
    print('='*60)
else:
    print('FAILED: inconsistencies found.')
