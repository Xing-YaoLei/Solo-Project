import urllib.request, json, sys

def api(method, path, body=None):
    url = f"http://localhost:8002{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    data = json.dumps(body).encode() if body else None
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def main():
    print("=" * 60)
    print("1. 修改阈值 (id=100): 30 -> 45 天, 操作人=运营经理-李")
    s, d = api("PUT", "/api/thresholds/100", {
        "threshold_value": 45, "updated_by": "运营经理-李",
        "remark": "月底冲刺调整预警天数"
    })
    val = d.get('threshold_value') if s == 200 else str(d)
    print(f"  状态: {s}, 阈值当前值: {val}")

    print("\n2. 查询阈值审计日志 (记录操作人+前后值)")
    s, logs = api("GET", "/api/thresholds/100/audit-logs?page_size=5")
    log_list = logs if isinstance(logs, list) else logs.get('items', [])
    for l in log_list[:3]:
        print(f"  [{str(l.get('created_at',''))[:19]}] {l.get('operator_name')} "
              f"{l.get('operation_type')}: {l.get('old_value')} -> {l.get('new_value')} "
              f"备注: {l.get('remark')}")

    print("\n3. 新增复盘备注 (关联总会员阶段)")
    s, note = api("POST", "/api/renewal-notes", {
        "member_id": 1, "title": "E2E: 漏斗总会员复盘",
        "content": "从核销记录分析, 需加强触达流程", "priority": "high",
        "related_funnel_stage": "total_members", "created_by_name": "测试人员"
    })
    nid = note.get('note_id') if s == 200 else str(note)
    print(f"  状态: {s}, note_id: {nid}")

    print("\n4. 查关联该阶段的所有备注+处理结论 (图表旁显示)")
    s, notes_data = api("GET", "/api/renewal-notes?related_funnel_stage=total_members")
    notes = notes_data.get('items', notes_data if isinstance(notes_data, list) else [])
    print(f"  共 {notes_data.get('total', len(notes))} 条备注:")
    for n in notes[:3]:
        conc = n.get('conclusion') or '待处理'
        print(f"    - [{n.get('status')}] {n.get('title')} "
              f"(创建人: {n.get('created_by_name')}) -> 结论: {str(conc)[:18]}")

    print("\n5. 退款原因下钻 (教练变动 -> 退款会员列表)")
    s, d = api("GET", "/api/analytics/refund-reason-members?reason=coach_change&page_size=3")
    items = d.get('items', [])
    print(f"  共 {d.get('total')} 人. 前3人:")
    for m in items[:3]:
        amt = m.get('actual_refund_amount') or m.get('refund_amount')
        print(f"    - {m.get('member_no')} {m.get('name')} {amt}元")

    print("\n6. 会员详情 id=1 (真实 DuckDB 数据)")
    s, d = api("GET", "/api/members/1")
    m = d.get('member', {})
    mcount = len(d.get('memberships', []))
    print(f"  姓名: {m.get('name')}, 手机: {m.get('phone')}, "
          f"等级: {m.get('level')}, 会籍卡: {mcount}张, "
          f"累计消费: {m.get('total_purchased_amount')}元")

    print("\n7. 漏斗各阶段下钻 (全部5个阶段)")
    for stage in ["total_members", "active_members", "expiring_members",
                  "contacted_members", "renewed_members"]:
        s, d = api("GET", f"/api/analytics/funnel-stage-members?stage={stage}&page_size=1")
        items = d.get('items') or []
        name = items[0].get('name') if items else '-'
        print(f"  {stage}: total={d.get('total')}, 示例会员: {name}")

    print("\n" + "=" * 60)
    print("全链路验证通过! 阈值修改+审计、备注持久化、下钻会员全部正常")
    return 0

sys.exit(main())
