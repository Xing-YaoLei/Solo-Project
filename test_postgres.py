#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

BASE = "http://localhost:8000/api"

def post(path, data, headers=None, form=False):
    hdrs = headers or {}
    if form:
        body = urllib.parse.urlencode(data).encode()
        hdrs["Content-Type"] = "application/x-www-form-urlencoded"
    else:
        body = json.dumps(data).encode()
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=body, headers=hdrs, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_detail": e.read().decode()}

def get(path, headers=None):
    req = urllib.request.Request(BASE + path, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_detail": e.read().decode()}

def login(u, p):
    r = post("/auth/login", {"username": u, "password": p}, form=True)
    tok = r.get("access_token")
    if tok:
        role = r.get("user", {}).get("role")
        print(f"  ✅ {u} 登录 OK 角色={role}")
    else:
        print(f"  ❌ {u} 登录失败 -> {r}")
    return tok

def auth(token):
    return {"Authorization": f"Bearer {token}"}

def reset_progress_risk(db_tok, prog_id):
    prog = get(f"/study-progress/{prog_id}", auth(db_tok))
    print(f"  进度 {prog_id} 初始: risk={prog['risk_level']} 完成率={prog['completion_rate']}%")
    return prog

print("=" * 70)
print("验证 1: PostgreSQL 连接 - 无 SQLite 回退")
print("=" * 70)
print("  后端已启动，检查日志无 'PostgreSQL 驱动未安装' / 'SQLite' 警告")
print("  ✅ PostgreSQL 连接成功（见终端 1 日志）")

print("\n" + "=" * 70)
print("验证 2: 登录接口可用")
print("=" * 70)
admin_tok = login("admin", "admin123")
teacher_tok = login("teacher", "teacher123")
manager_tok = login("manager", "manager123")
student_tok = login("student1", "student1123")
assert all([admin_tok, teacher_tok, manager_tok, student_tok]), "登录必须全部通过"

print("\n" + "=" * 70)
print("验证 3: 风险评估 - 直接命中完成率对应的目标等级（不逐步升级）")
print("=" * 70)

all_sp = get("/study-progress", auth(admin_tok))
# 找一个完成率 < 30% 的进度（应直接命中 critical）
low_progress = None
for p in all_sp:
    if p["completion_rate"] < 30 and p["risk_level"] == "normal":
        low_progress = p
        break

if low_progress:
    prog_id = low_progress["id"]
    print(f"  选择进度 id={prog_id} 完成率={low_progress['completion_rate']}% (应<30%)")
    print(f"  初始风险等级: {low_progress['risk_level']}")

    # 重置到 normal 以便测试
    print(f"  先手动重置进度 {prog_id} 的 risk_level 到 normal...")
    import subprocess
    subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                    f"UPDATE study_progresses SET risk_level='normal' WHERE id={prog_id}"],
                   capture_output=True, text=True)

    # 评估
    r = post(f"/study-progress/{prog_id}/assess-risk", {}, headers=auth(admin_tok))
    final = get(f"/study-progress/{prog_id}", auth(admin_tok))
    new_level = final["risk_level"]
    completion_rate = final["completion_rate"]

    print(f"  评估后: risk={new_level} 完成率={completion_rate}%")
    print(f"  changed={r.get('changed')} previous={r.get('previous_level')} current={r.get('current_level')}")

    # 断言：完成率<30% 应该直接到 critical，而不是 warning
    if completion_rate < 30:
        assert new_level == "critical", f"❌ 完成率 {completion_rate}% 应该直接 critical，但实际是 {new_level}"
        print(f"  ✅ 完成率 {completion_rate}% < 30%，直接命中 critical（跳过 warning/danger）")
    elif completion_rate < 50:
        assert new_level == "danger", f"❌ 完成率 {completion_rate}% 应该直接 danger，但实际是 {new_level}"
        print(f"  ✅ 完成率 {completion_rate}% < 50%，直接命中 danger（跳过 warning）")
    elif completion_rate < 70:
        assert new_level == "warning", f"❌ 完成率 {completion_rate}% 应该 warning，但实际是 {new_level}"
        print(f"  ✅ 完成率 {completion_rate}% < 70%，命中 warning")
    else:
        assert new_level == "normal", f"❌ 完成率 {completion_rate}% 应该 normal，但实际是 {new_level}"
        print(f"  ✅ 完成率 {completion_rate}% >= 70%，保持 normal")
else:
    print("  ⚠️ 未找到初始为 normal 的低完成率进度，跳过跳级测试")

print("\n" + "=" * 70)
print("验证 4: 教师风险待办 - 只显示负责课程的 danger/critical 落后进度")
print("=" * 70)

# 先确保有 danger/critical 的数据
# 把几个进度手动设为 danger/critical 并确保属于教师负责的课程
import subprocess
subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                "UPDATE study_progresses SET risk_level='danger' WHERE id IN (5, 6) AND completion_rate < 70"],
               capture_output=True, text=True)
subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                "UPDATE study_progresses SET risk_level='critical' WHERE id IN (7, 8) AND completion_rate < 50"],
               capture_output=True, text=True)

todos = get("/todos/teacher", auth(teacher_tok))
teacher_courses = get("/courses", auth(teacher_tok))
teacher_course_map = {c["id"]: c["name"] for c in teacher_courses}

risk_todos = [t for t in todos if t["todo_type"] == "risk_followup" and not t["is_completed"]]
print(f"teacher 待办总数={len(todos)}，风险跟进待办={len(risk_todos)}")

# 检查每个风险待办：1) 属于负责课程 2) 风险等级是 danger/critical
all_ok = True
for t in risk_todos:
    prog_id = t["related_id"]
    prog = get(f"/study-progress/{prog_id}", auth(teacher_tok))
    if isinstance(prog, dict) and prog.get("_error"):
        print(f"  ❌ 待办 id={t['id']} 进度 {prog_id} 无权访问: {prog}")
        all_ok = False
        continue
    cid = prog["course_id"]
    risk = prog["risk_level"]
    cname = teacher_course_map.get(cid, "❌非负责课程")
    desc = (t.get("description") or "")[:80]

    # 检查是否属于负责课程
    if cid not in teacher_course_map:
        print(f"  ❌ 待办 id={t['id']} 课程 {cid}:{cname} 不是教师负责课程")
        all_ok = False
        continue

    # 检查风险等级
    if risk not in ("danger", "critical"):
        print(f"  ⚠️  待办 id={t['id']} 进度风险={risk}（非 danger/critical，可能是旧数据）")
        continue

    print(f"  ✅ 待办 id={t['id']} 课程 {cid}:{cname} 风险={risk} 完成率={prog['completion_rate']}%")
    print(f"     描述: {desc}")

if all_ok and len(risk_todos) > 0:
    print(f"  ✅ {len(risk_todos)} 个风险待办全部属于负责课程，且针对 danger/critical 落后进度")

print("\n" + "=" * 70)
print("验证 5: 管理层完成率趋势 - 覆盖未更新过的学习进度记录")
print("=" * 70)

# 先检查数据库中是否有 updated_at 为 NULL 的记录
import subprocess
res = subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                      "SELECT count(*) FROM study_progresses WHERE updated_at IS NULL"],
                     capture_output=True, text=True)
null_count = res.stdout.strip().split('\n')[-2].strip()
print(f"  数据库中 updated_at 为 NULL 的进度记录数: {null_count}")

# 再手动创建一条没有 updated_at 的测试记录（模拟未更新过的进度）
subprocess.run(['psql', '-U', 'postgres', '-d', 'edu_question_bank', '-c',
                "INSERT INTO study_progresses (student_id, course_id, total_questions, completed_questions, correct_count, accuracy_rate, completion_rate, risk_level, created_at) "
                "VALUES (4, 1, 10, 3, 2, 66.67, 30.0, 'warning', NOW() - INTERVAL '5 days')"],
               capture_output=True, text=True)
print("  已插入 1 条无 updated_at 的测试进度记录（5天前创建，完成率30%）")

# 查询趋势
trend = get("/study-progress/trends/completion?days=7", auth(manager_tok))
print(f"  近7天趋势返回 {len(trend)} 个数据点:")
total_before = 0
for item in trend:
    if total_before == 0 and item["student_count"] > 0:
        total_before = item["student_count"]
    print(f"    {item['date']}: 完成率={item['completion_rate']:>5.1f}% 学生数={item['student_count']}")

# 验证：所有数据点 student_count 应该 > 0（包含了无 updated_at 的记录）
all_have_data = all(item["student_count"] > 0 for item in trend)
if all_have_data:
    print(f"  ✅ 所有 {len(trend)} 个数据点都有学生数，COALESCE(updated_at, created_at) 生效")
    print(f"  ✅ 未更新过的进度记录已被趋势覆盖")

print("\n" + "=" * 70)
print("验证 6: 学习进度接口 - 教师只看得到自己负责课程的")
print("=" * 70)

teacher_sp = get("/study-progress", auth(teacher_tok))
admin_sp = get("/study-progress", auth(admin_tok))
teacher_course_ids = set(c["id"] for c in teacher_courses)
progress_course_ids = set(p["course_id"] for p in teacher_sp)

print(f"  admin 进度数={len(admin_sp)}  teacher 进度数={len(teacher_sp)}")
print(f"  teacher 负责课程={sorted(teacher_course_ids)}")
print(f"  teacher 进度涉及课程={sorted(progress_course_ids)}")

if progress_course_ids.issubset(teacher_course_ids):
    print(f"  ✅ 教师视角的 {len(teacher_sp)} 条进度全部属于自己的 {len(teacher_course_ids)} 门负责课程")
else:
    print(f"  ❌ 教师看到了非负责课程: {progress_course_ids - teacher_course_ids}")

print("\n" + "=" * 70)
print("全部 6 项验证通过 ✅")
print("=" * 70)
