import requests

BASE = "http://localhost:8000"

def test(name, method, path, body=None):
    print(f"\n=== {name} ===")
    try:
        if method == "GET":
            r = requests.get(BASE + path)
        else:
            r = requests.post(BASE + path, json=body)
        data = r.json()
        code = data.get("code")
        msg = data.get("message")
        body = data.get("data")
        print(f"  HTTP: {r.status_code}, code: {code}, msg: {msg}")
        return body
    except Exception as e:
        print(f"  错误: {e}")
        return None

# 1. KPI
kpi = test("KPI Overview", "GET", "/api/kpi/overview")
if kpi:
    print(f"  total_tickets: {kpi.get('total_tickets')}, sold_rate: {kpi.get('sold_rate')}")

# 2. 赞助列表
sp_list = test("Sponsorship List", "GET", "/api/sponsorship/list?page=1&page_size=3")
if sp_list:
    items = sp_list.get("items", [])
    pi = sp_list.get("page_info", {})
    print(f"  总数: {pi.get('total')}, 当前页: {len(items)} 条")
    first_id = items[0]["id"] if items else None
    print(f"  第一条 ID: {first_id[:12]}..." if first_id else "  无数据")

    # 3. 赞助明细
    if first_id:
        detail = test("Sponsorship Detail", "GET", f"/api/sponsorship/{first_id}/detail")
        if detail:
            print(f"  赞助商: {detail.get('sponsor_name')}, 权益: {detail.get('benefit_type')}")
            print(f"  合同: {detail.get('contract_qty')}, 已兑现: {detail.get('fulfilled_qty')}")
            print(f"  兑现记录数: {len(detail.get('fulfillment_records', []))}")

# 4. 核销口径
defs = test("Verification Definition (5 rules)", "GET", "/api/verification/definition")
if defs:
    print(f"  规则数量: {len(defs)}")
    for d in defs:
        print(f"    - {d['id']}: {d['title']}")

# 5. 退票分布
ref_dist = test("Refund Distribution", "GET", "/api/refund/distribution")
if ref_dist:
    print(f"  天数: {len(ref_dist)}")
    disputed_days = [d for d in ref_dist if d.get("disputed_count", 0) > 0]
    print(f"  有争议天数: {len(disputed_days)}")
    if disputed_days:
        d = disputed_days[0]
        print(f"    示例日: {d['date']}, 退票: {d['refund_count']}, 争议: {d['disputed_count']}")
        pts = d.get("disputed_points", [])
        if pts:
            p = pts[0]
            print(f"    争议点示例: id={p.get('id')}, refund_id={p.get('refund_id')}, amount={p.get('amount')}")

            # 6. 退票样本
            sample = test("Refund Sample", "GET", f"/api/refund/{p['refund_id']}/sample")
            if sample:
                print(f"    样本: {sample.get('registrant_name')}, 争议: {sample.get('is_disputed')}")

                # 7. 标记处理
                processed = test("Mark Processed", "POST",
                               f"/api/refund/{p['refund_id']}/mark-processed",
                               {"note": "已与客户协商一致，争议解除"})
                if processed:
                    print(f"    处理后争议状态: {processed.get('is_disputed')}")
                    print(f"    备注: {processed.get('dispute_note')[:50]}...")

# 8. 票种排行
rank = test("Ticket Rank", "GET", "/api/ticket/rank?metric=absolute&top=5")
if rank:
    print(f"\n=== Ticket Rank (absolute) ===")
    for t in rank[:3]:
        print(f"  {t['rank']}. {t['rule_name']}: {t['sold_count']} 张 ({t['sold_ratio']:.1f}%)")

print("\n✅ 所有 API 测试完成")
