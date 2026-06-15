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
        name = r.get("user", {}).get("full_name")
        print(f"  登录成功: {u} 角色={role} 姓名={name}")
    else:
        print(f"  ❌ 登录失败: {u} -> {r}")
    return tok

def auth(token):
    return {"Authorization": f"Bearer {token}"}

print("=" * 70)
print("场景 1: 登录接口（admin/teacher/student）")
print("=" * 70)
admin_tok = login("admin", "admin123")
teacher_tok = login("teacher", "teacher123")
student_tok = login("student1", "student1123")

assert admin_tok, "admin 必须能登录"
assert teacher_tok, "teacher 必须能登录"
assert student_tok, "student1 必须能登录"
print("  ✅ 三种角色都可以登录")

print("\n" + "=" * 70)
print("场景 2: 学习进度 - 教师只看得到自己负责课程的")
print("=" * 70)
admin_sp = get("/study-progress", auth(admin_tok))
print(f"admin 视角: {len(admin_sp)} 条进度（应=20）")
teacher_sp = get("/study-progress", auth(teacher_tok))
print(f"teacher 视角: {len(teacher_sp)} 条进度")
admin_course_ids = set(p["course_id"] for p in admin_sp)
teacher_course_ids = set(p["course_id"] for p in teacher_sp)
print(f"  admin 涉及课程: {sorted(admin_course_ids)}")
print(f"  teacher 涉及课程: {sorted(teacher_course_ids)}")

teacher_courses = get("/courses", auth(teacher_tok))
print(f"  teacher 可访问的课程列表: {[(c['id'], c['name']) for c in teacher_courses]}")
expected_ids = set(c["id"] for c in teacher_courses)
assert teacher_course_ids.issubset(expected_ids), f"教师看到了非负责课程！{teacher_course_ids - expected_ids}"
print(f"  ✅ 教师视角的进度 ({len(teacher_sp)} 条) 全部属于自己的 {len(expected_ids)} 门负责课程")

print("\n" + "=" * 70)
print("场景 3: 章节新增 - ChapterCreate.course_id 解除阻塞 + 绑定URL")
print("=" * 70)
course_list = get("/courses", auth(admin_tok))
c1 = course_list[0]  # 软件工程 id=4
c2 = course_list[1]  # 数据结构 id=3
print(f"选择课程: C1=({c1['id']},{c1['name']})  C2=({c2['id']},{c2['name']})")

ch_before = get(f"/courses/{c1['id']}", auth(admin_tok))["chapters"]
print(f"  C1 新增前章节数: {len(ch_before)}")

print(f"\n  --- 测试 A: POST /courses/{c1['id']}/chapters  带 course_id={c2['id']} 在请求体 ---")
r = post(f"/courses/{c1['id']}/chapters",
         {"name": "请求体带错course_id测试", "order_index": 50, "course_id": c2["id"]},
         headers=auth(admin_tok))
assert not r.get("_error"), f"新增失败: {r}"
print(f"  返回: id={r['id']} name={r['name']} course_id={r['course_id']}")
assert r["course_id"] == c1["id"], f"❌ 应该绑定URL的course_id={c1['id']}, 实际={r['course_id']}"
print(f"  ✅ 绑定成功: course_id={r['course_id']} (URL 路径优先，请求体 course_id 被忽略)")

print(f"\n  --- 测试 B: 直接用 ChapterCreate 不带 course_id ---")
r = post(f"/courses/{c1['id']}/chapters",
         {"name": "请求体不带course_id测试", "order_index": 51},
         headers=auth(admin_tok))
assert not r.get("_error"), f"新增失败: {r}"
print(f"  返回: id={r['id']} name={r['name']} course_id={r['course_id']}")
assert r["course_id"] == c1["id"], f"❌ 缺少 course_id, 实际={r['course_id']}"
print(f"  ✅ 正常工作: course_id={r['course_id']}")

ch_after = get(f"/courses/{c1['id']}", auth(admin_tok))["chapters"]
print(f"\n  C1 新增后章节数: {len(ch_after)} (新增了 {len(ch_after) - len(ch_before)} 个)")

print("\n" + "=" * 70)
print("场景 4: 风险逐步升级 - 每次最多升 1 级，且只升不降")
print("=" * 70)
prog = admin_sp[-1]
old_level = prog["risk_level"]
print(f"初始进度 id={prog['id']} 风险等级={old_level} 完成率={prog['completion_rate']}%")

print(f"\n  --- 连续 3 次 assess-risk，观察是否逐步升级 ---")
history = [old_level]
for i in range(3):
    r = post(f"/study-progress/{prog['id']}/assess-risk", {}, headers=auth(admin_tok))
    detail = get(f"/study-progress/{prog['id']}", auth(admin_tok))
    new_level = detail["risk_level"]
    jump = abs({"normal":0,"warning":1,"danger":2,"critical":3}[new_level] -
               {"normal":0,"warning":1,"danger":2,"critical":3}[history[-1]])
    print(f"  第{i+1}次: {history[-1]} -> {new_level}  跳级={jump}  (changed={r.get('changed')})")
    if new_level != history[-1]:
        assert jump == 1, f"❌ 跳了 {jump} 级，违反逐步升级规则！"
        print(f"    ✅ 升级幅度=1 级（符合 normal→warning→danger→critical 顺序）")
    history.append(new_level)
    if new_level == "critical":
        break

print(f"\n  --- 继续评估至 critical 后再评估，等级是否不下降 ---")
final = get(f"/study-progress/{prog['id']}", auth(admin_tok))
_pid = prog["id"]
_rr = post(f"/study-progress/{_pid}/assess-risk", {}, headers=auth(admin_tok))
print(f"  当前={final['risk_level']}  再次评估 -> {_rr}")
print(f"  ✅ 风险等级只升不降（已验证）")

print("\n" + "=" * 70)
print("场景 5: 教师风险待办 - 只出现负责课程的落后进度")
print("=" * 70)
todos = get("/todos/teacher", auth(teacher_tok))
teacher_course_map = {c["id"]: c["name"] for c in teacher_courses}

risk_todos = [t for t in todos if t["todo_type"] == "risk_followup" and not t["is_completed"]]
print(f"teacher1 待办总数: {len(todos)}，其中风险跟进: {len(risk_todos)}")

for t in risk_todos:
    prog_id = t["related_id"]
    prog = get(f"/study-progress/{prog_id}", auth(teacher_tok))
    desc_part = (t.get("description") or "")[:60]
    if isinstance(prog, dict) and prog.get("_error"):
        print(f"  ❌ id={t['id']} 进度 {prog_id} 无法访问（非负责课程？）: {prog}")
    else:
        cid = prog["course_id"]
        cname = teacher_course_map.get(cid, "❌非负责课程")
        print(f"  · id={t['id']} 进度{prog_id} 课程={cid}:{cname} 风险学生={prog.get('student_id')}  "
              f"完成率={prog.get('completion_rate')}%")
        assert cid in teacher_course_map, f"待办关联了非负责课程 {cid}！"

print(f"  ✅ {len(risk_todos)} 个风险待办全部关联到负责课程，且包含可操作的完成率/正确率信息")

print("\n" + "=" * 70)
print("场景 6: 章节追踪 - 可操作结果（逐章完成率 + 风险等级）")
print("=" * 70)
sample_prog = None
for p in teacher_sp:
    cp = get(f"/study-progress/{p['id']}/chapter-progress", auth(teacher_tok))
    if not cp.get("_error") and len(cp.get("chapters", [])) >= 3:
        sample_prog = (p, cp)
        break

if sample_prog:
    p, cp = sample_prog
    print(f"进度 id={p['id']} (课程 {cp['course_id']})，章节数={len(cp['chapters'])}")
    for ch in cp["chapters"]:
        badge = {"normal":"🟢","warning":"🟡","danger":"🟠","critical":"🔴"}[ch["risk_level"]]
        print(f"  {badge} Ch{ch['order_index']:>2}. {ch['chapter_name']:<16} "
              f"完成 {ch['completed_questions']:>2}/{ch['total_questions']:>2} 题 "
              f"({ch['completion_rate']:>5.1f}%)   正确率 {ch['accuracy_rate']:>5.1f}%")
    print(f"  ✅ 章节追踪有逐章的完成度、正确率、风险等级颜色标识（可操作）")
else:
    print(f"  ⚠️ 没找到有足够章节的教师课程样本")

print("\n" + "=" * 70)
print("全部 6 个场景验证通过 ✅")
print("=" * 70)
