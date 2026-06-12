import urllib.request, json
url = "http://localhost:8000/api/reports/review-material"
with urllib.request.urlopen(url) as resp:
    d = json.loads(resp.read())
print("code:", d.get("code"))
print("message:", d.get("message"))
data = d.get("data", {})
print("overall_metrics:", json.dumps(data.get("overall_metrics"), ensure_ascii=False))
print("summary (first 3):")
for s in (data.get("summary") or [])[:3]:
    print("  -", s)
print("offline_equipments count:", len(data.get("offline_equipments") or []))
for eq in (data.get("offline_equipments") or [])[:3]:
    print("  -", eq.get("equipment_name"), eq.get("store_name"),
          "is_warning:", eq.get("is_warning"),
          "days_since_clean:", eq.get("days_since_clean"),
          "remarks:", len(eq.get("remarks") or []))
print("failed_inspections count:", len(data.get("failed_inspections") or []))
for fi in (data.get("failed_inspections") or [])[:2]:
    print("  -", fi.get("equipment_name"), "score:", fi.get("score"),
          "inspector:", fi.get("inspector"),
          "issues:", (fi.get("issues_found") or "")[:40])
print("problematic_stores count:", len(data.get("problematic_stores") or []))
for ps in (data.get("problematic_stores") or [])[:3]:
    print("  -", ps.get("store_name"), "pass_rate:", ps.get("pass_rate"))
print("review_conclusion:", data.get("review_conclusion"))
print("thresholds_used:", json.dumps(data.get("thresholds_used"), ensure_ascii=False))
