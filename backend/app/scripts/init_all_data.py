"""
可重复初始化脚本：一键生成完整业务数据
每次运行会先 DROP 所有表，再重新生成。

使用方式：
    cd backend
    python3 -m app.scripts.init_all_data
"""
import sys
import random
from datetime import datetime, timedelta, date

sys.path.insert(0, '.')

from app.db.duckdb_conn import reset_duckdb, init_duckdb_tables, get_duckdb_connection
from app.services.repository import (
    create_threshold,
    generate_expiry_renewal_notes,
    create_note,
)


def init_default_thresholds():
    defaults = [
        {"threshold_type": "renewal_warning_days", "threshold_name": "续费预警天数",
         "threshold_value": 30.0, "threshold_unit": "天",
         "description": "会员权益到期前N天开始预警提醒，自动生成续费备注任务",
         "created_by": "系统初始化"},
        {"threshold_type": "low_renewal_rate", "threshold_name": "低续费率预警",
         "threshold_value": 50.0, "threshold_unit": "%",
         "description": "续费率低于该值时触发看板高亮预警",
         "created_by": "系统初始化"},
        {"threshold_type": "inactive_days", "threshold_name": "不活跃预警天数",
         "threshold_value": 15.0, "threshold_unit": "天",
         "description": "连续N天未到店视为不活跃会员，自动触达",
         "created_by": "系统初始化"},
        {"threshold_type": "expiring_soon", "threshold_name": "即将到期紧急提醒",
         "threshold_value": 7.0, "threshold_unit": "天",
         "description": "到期前N天紧急提醒，优先级升级为 urgent",
         "created_by": "系统初始化"},
        {"threshold_type": "low_sessions_remaining", "threshold_name": "低课时预警",
         "threshold_value": 5.0, "threshold_unit": "节",
         "description": "剩余课时低于该值时触发续费提醒",
         "created_by": "系统初始化"},
    ]
    for item in defaults:
        create_threshold(item)
    print(f"✓ 已初始化 {len(defaults)} 条预警阈值配置")


def generate_all_data():
    reset_duckdb()
    init_duckdb_tables()
    print("✓ 已重置并初始化 DuckDB 表结构")

    init_default_thresholds()

    con = get_duckdb_connection()
    now = datetime.now()
    today = now.date()

    coaches = [(1, "张教练"), (2, "李教练"), (3, "王教练"), (4, "陈教练"), (5, "刘教练")]
    levels = ["normal", "silver", "gold", "platinum"]
    genders = ["男", "女"]
    member_names = [
        "张伟", "王芳", "李娜", "刘洋", "陈静", "杨帆", "赵磊", "黄丽",
        "周强", "吴敏", "徐斌", "孙艳", "马超", "朱琳", "胡军", "郭倩",
        "林峰", "何雪", "高翔", "罗雯", "郑宇", "梁欣", "谢涛", "唐萍",
        "韩冰", "冯丽", "董明", "萧然", "程亮", "蔡红", "许娜", "曹阳",
        "袁浩", "邓颖", "石雷", "姚丽", "谭鑫", "廖静", "邹凯", "曾慧"
    ]

    members_data = []
    memberships_data = []
    transactions_data = []
    courses_data = []
    course_records_data = []
    access_data = []
    refund_data = []

    mtype_list = ["private_coaching", "group_class", "combo"]
    mname_map = {
        "private_coaching": ["私教30节课", "私教50节课", "私教100节课", "VIP私教定制", "冠军私教计划"],
        "group_class": ["团课月卡", "团课季卡", "团课半年卡", "团课年卡"],
        "combo": ["综合季卡", "综合半年卡", "综合年卡", "尊享组合套餐"]
    }
    tx_types = ["purchase", "renewal", "refund"]
    payment_methods = ["wechat", "alipay", "cash", "card", "transfer"]
    sales_names = ["销售小王", "销售小李", "销售小张", "销售小陈"]
    cashier_names = ["收银A", "收银B", "收银C"]
    refund_reasons = ["injury", "move_away", "dissatisfied", "coach_change",
                      "price_reason", "time_conflict", "health_reason", "other"]
    refund_statuses = ["pending", "approved", "completed", "completed", "completed"]
    course_statuses = ["completed", "completed", "completed", "completed", "completed",
                       "scheduled", "confirmed", "cancelled", "no_show"]

    for i in range(len(member_names)):
        member_id = i + 1
        coach = random.choice(coaches)
        join_date = today - timedelta(days=random.randint(30, 400))
        expiry_date = today + timedelta(days=random.randint(-60, 120))
        last_visit = today - timedelta(days=random.randint(0, 25))
        total_sessions_bought = 0
        total_sessions_used = 0
        total_amount = 0.0

        num_memberships = random.randint(1, 3)
        for j in range(num_memberships):
            mtype = random.choice(mtype_list)
            mname = random.choice(mname_map[mtype])
            sessions = random.choice([12, 24, 36, 50, 60, 100])
            used = random.randint(max(0, sessions - random.randint(0, 40)), sessions) if expiry_date >= today - timedelta(days=60) else sessions
            remaining = sessions - used
            unit_price = round(random.uniform(180, 600), 2)
            amt = round(unit_price * sessions, 2)
            start_date = expiry_date - timedelta(days=random.randint(60, 365))

            membership_id = len(memberships_data) + 1
            is_renewal = 1 if (j > 0 or random.random() > 0.55) else 0

            memberships_data.append((
                membership_id, f"MS{20240000 + membership_id}",
                member_id, mtype, mname, sessions, used, remaining, amt, unit_price,
                start_date, expiry_date,
                "active" if remaining > 0 and expiry_date >= today else
                ("used_up" if remaining == 0 else "expired"),
                is_renewal,
                len(transactions_data) + 1 if j == 0 else len(transactions_data),
                None if j == 0 else len(memberships_data),
                None, now, now,
            ))
            total_sessions_bought += sessions
            total_sessions_used += used
            total_amount += amt

            tx_type = "renewal" if is_renewal else "purchase"
            disc = round(amt * random.uniform(0, 0.18), 2)
            actual = round(amt - disc, 2)
            tx_date = datetime.combine(start_date, datetime.min.time()) + timedelta(
                hours=random.randint(9, 21), minutes=random.randint(0, 59))
            transactions_data.append((
                len(transactions_data) + 1,
                f"T{202400000 + len(transactions_data) + 1}",
                member_id, membership_id, tx_type, amt, disc, actual,
                random.choice(payment_methods), "success",
                tx_date, tx_date.date(), None, None, random.choice(sales_names),
                None, random.choice(cashier_names), None, tx_date, now,
            ))

            if random.random() < 0.12:
                r_amt = round(amt * random.uniform(0.1, 0.5), 2)
                r_sessions = random.randint(1, max(1, sessions // 5))
                penalty = round(r_amt * random.uniform(0, 0.25), 2)
                actual_r = round(r_amt - penalty, 2)
                apply_d = tx_date + timedelta(days=random.randint(10, 120))
                status = random.choice(refund_statuses)

                refund_data.append((
                    len(refund_data) + 1,
                    f"R{202400000 + len(refund_data) + 1}",
                    member_id, membership_id, len(transactions_data),
                    random.choice(refund_reasons),
                    f"会员申请退款的详细原因说明",
                    r_amt, r_sessions, penalty, actual_r, status,
                    apply_d, apply_d.date(),
                    apply_d + timedelta(days=random.randint(0, 3)) if status != "pending" else None,
                    apply_d + timedelta(days=random.randint(3, 10)) if status == "completed" else None,
                    None, random.choice(sales_names),
                    None, random.choice(["经理A", "经理B", "运营总监"]),
                    None, apply_d, now,
                ))

                transactions_data.append((
                    len(transactions_data) + 1,
                    f"T{202400000 + len(transactions_data) + 1}",
                    member_id, membership_id, "refund", -r_amt, 0, -actual_r,
                    random.choice(payment_methods),
                    "refunded" if status == "completed" else
                    ("partial_refunded" if status == "approved" else "success"),
                    apply_d + timedelta(days=5), (apply_d + timedelta(days=5)).date(),
                    len(transactions_data), None, random.choice(sales_names),
                    None, random.choice(cashier_names), None,
                    apply_d + timedelta(days=5), now,
                ))

            # 课程记录
            for k in range(used + random.randint(0, 3)):
                c_date = start_date + timedelta(days=random.randint(0, (expiry_date - start_date).days))
                if c_date > today + timedelta(days=7):
                    continue
                hour = random.randint(8, 21)
                c_status = "scheduled" if c_date > today else random.choice(course_statuses)
                course_id = len(courses_data) + 1
                is_verified = 1 if c_status == "completed" else 0
                verify_t = None if not is_verified else datetime.combine(c_date, datetime.min.time()) + timedelta(hours=hour + 1)

                courses_data.append((
                    course_id, f"C{20240000 + course_id}",
                    member_id, membership_id, coach[0], coach[1],
                    "私教课" if mtype == "private_coaching" else ("团课" if mtype == "group_class" else "综合课"),
                    c_date, f"{hour:02d}:00", f"{hour + 1:02d}:00", 60,
                    c_status,
                    verify_t, verify_t,
                    is_verified, verify_t, 1, None,
                    now, now,
                ))

                if is_verified:
                    consume_before = sessions - (used - k)
                    consume_after = consume_before - 1
                    course_records_data.append((
                        len(course_records_data) + 1,
                        f"CR{202400000 + len(course_records_data) + 1}",
                        member_id, membership_id, course_id, "course", 1,
                        consume_before, consume_after, None,
                        random.choice(["前台小王", "前台小李", "系统自动", coach[1]]),
                        verify_t, verify_t.date(),
                        f"DEV{random.randint(100, 999)}",
                        random.choice(["一楼前台", "二楼前台", "私教区入口", "团课教室"]),
                        None, verify_t,
                    ))

        # 门禁记录
        for k in range(random.randint(10, 60)):
            access_d = today - timedelta(days=random.randint(0, 60))
            access_t = datetime.combine(access_d, datetime.min.time()) + timedelta(
                hours=random.randint(7, 22), minutes=random.randint(0, 59))
            is_entry = random.random() < 0.5
            access_data.append((
                len(access_data) + 1,
                f"AR{202400000 + len(access_data) + 1}",
                member_id, f"M{2024000 + member_id}", member_names[i],
                "entry" if is_entry else "exit",
                access_t, access_d,
                f"ACC{random.randint(100, 999)}",
                random.choice(["东门", "西门", "北门", "私教入口"]),
                random.choice(["人脸", "刷卡", "二维码"]),
                1, None, None, access_t,
            ))

        members_data.append((
            member_id, f"M{2024000 + member_id}",
            member_names[i], f"138{random.randint(10000000, 99999999)}",
            random.choice(genders),
            today - timedelta(days=random.randint(18 * 365, 60 * 365)),
            levels[i % len(levels)],
            "active" if expiry_date >= today else "expired",
            join_date, coach[0], coach[1],
            round(total_amount, 2),
            total_sessions_used,
            total_sessions_bought - total_sessions_used,
            last_visit, expiry_date, 30,
            f"xx市xx区xx路{random.randint(1, 2000)}号",
            None, now, now,
        ))

    # 写入会员
    con.executemany("""
        INSERT INTO dim_member VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, members_data)
    print(f"✓ 生成 {len(members_data)} 条会员档案")

    # 写入会籍卡
    con.executemany("""
        INSERT INTO dim_membership VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, memberships_data)
    print(f"✓ 生成 {len(memberships_data)} 条会籍卡")

    # 写入交易
    con.executemany("""
        INSERT INTO fact_transaction VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, transactions_data)
    print(f"✓ 生成 {len(transactions_data)} 条交易/收银记录")

    # 写入课程
    con.executemany("""
        INSERT INTO courses VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, courses_data)
    print(f"✓ 生成 {len(courses_data)} 条课程表记录")

    # 写入核销
    con.executemany("""
        INSERT INTO fact_course_record VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, course_records_data)
    print(f"✓ 生成 {len(course_records_data)} 条核销记录")

    # 写入门禁
    con.executemany("""
        INSERT INTO fact_access VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, access_data)
    print(f"✓ 生成 {len(access_data)} 条门禁记录")

    # 写入退款
    if refund_data:
        con.executemany("""
            INSERT INTO fact_refund VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, refund_data)
    print(f"✓ 生成 {len(refund_data)} 条退款记录")

    con.close()

    # ============== 自动生成权益到期备注任务 ==============
    generated = generate_expiry_renewal_notes("系统自动任务")
    print(f"✓ 自动生成 {generated} 条权益到期续费备注任务")

    # ============== 手动插入几条带结论的复盘备注（用于图表旁展示演示） ==============
    manual_notes = [
        {"member_id": 1, "source": "analysis", "title": "漏斗复盘：活跃→到期转化率提升方案",
         "content": "针对活跃会员没有到期提醒的情况，优化触达流程：在会员到店核销时前台口头提醒。",
         "conclusion": "已执行前台提醒话术培训，转化率预计提升15%",
         "status": "resolved", "priority": "high",
         "related_funnel_stage": "expiring_members",
         "created_by_name": "运营经理-王", "resolved_by_name": "运营经理-王"},

        {"member_id": 2, "source": "analysis", "title": "教练变动导致续费率下降复盘",
         "content": "李教练离职导致5位会员未续费，需要新教练一对一对接。",
         "conclusion": "已安排张教练接手，4位会员确认继续上课，1位退款处理中",
         "status": "resolved", "priority": "urgent",
         "related_funnel_stage": "renewed_members",
         "created_by_name": "店长", "resolved_by_name": "店长"},

        {"member_id": 3, "source": "manual", "title": "低续费率专项分析（5月）",
         "content": "5月续费率42%，低于阈值50%，需要逐一会员沟通。",
         "conclusion": "识别出主要原因为：1. 价格 2. 时间冲突。推出早鸟卡和周末班。",
         "status": "resolved", "priority": "urgent",
         "related_funnel_stage": "contacted_members",
         "created_by_name": "运营总监", "resolved_by_name": "运营总监"},

        {"member_id": 4, "source": "analysis", "title": "退款原因-教练变动专项",
         "content": "本月教练变动退款3笔，需要优化教练交接流程。",
         "conclusion": "建立教练离职提前30天报备制，过渡期新老教练共同服务1个月",
         "status": "in_progress", "priority": "high",
         "related_funnel_stage": "expiring_members",
         "created_by_name": "培训主管", "resolved_by_name": None},
    ]

    for n in manual_notes:
        create_note({
            **n,
            "due_date": today + timedelta(days=7),
        })
    print(f"✓ 插入 {len(manual_notes)} 条复盘备注（含处理结论）")

    print("\n========== 数据初始化完成 ==========")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    generate_all_data()
