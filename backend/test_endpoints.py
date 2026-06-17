import json
import urllib.request

BASE = "http://localhost:9090/api"

endpoints = [
    ("Dashboard 漏斗", "/dashboard/funnel"),
    ("Dashboard 核心指标", "/dashboard/metrics"),
    ("Dashboard 最近风险", "/dashboard/recent-risks?limit=3"),
    ("活动趋势", "/activity/trend?days=30"),
    ("活动时段分布", "/activity/time-distribution"),
    ("活动区域对比", "/activity/bed-area-comparison"),
    ("风险事件列表", "/risk/events?page=1&pageSize=5"),
    ("风险类型分布", "/risk/type-distribution"),
    ("风险每日趋势", "/risk/daily-trend?days=30"),
    ("老人档案列表", "/residents?page=1&pageSize=5"),
    ("床位利用率", "/residents/bed-utilization"),
    ("护理等级分布", "/residents/care-level-distribution"),
    ("年龄分布", "/residents/age-distribution"),
    ("疾病分布", "/residents/disease-distribution"),
    ("阈值列表", "/thresholds"),
    ("阈值变更日志", "/thresholds/change-logs?limit=5"),
    ("数据源统计", "/data/stats/sources"),
    ("双库信息", "/data/db/info"),
]

for name, path in endpoints:
    url = f"{BASE}{path}"
    try:
        r = json.loads(urllib.request.urlopen(url, timeout=10).read().decode())
        code = r.get("code", -1)
        if code == 0:
            print(f"  OK  {name}")
        else:
            print(f"  ERR {name}: code={code}, msg={r.get('message','')}")
    except Exception as e:
        print(f"  FAIL {name}: {str(e)[:80]}")
