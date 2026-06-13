import duckdb
import random
from datetime import datetime, timedelta
from ..db.duckdb_conn import get_duckdb_connection


def generate_mock_data():
    con = get_duckdb_connection()

    con.execute("DELETE FROM dim_member")
    con.execute("DELETE FROM dim_membership")
    con.execute("DELETE FROM fact_transaction")
    con.execute("DELETE FROM fact_course_record")
    con.execute("DELETE FROM fact_access")
    con.execute("DELETE FROM fact_refund")
    con.execute("DELETE FROM fact_renewal_note")

    coaches = [
        (1, "张教练"),
        (2, "李教练"),
        (3, "王教练"),
        (4, "陈教练"),
        (5, "刘教练"),
    ]

    levels = ["normal", "silver", "gold", "platinum"]
    member_names = [
        "张伟", "王芳", "李娜", "刘洋", "陈静", "杨帆", "赵磊", "黄丽",
        "周强", "吴敏", "徐斌", "孙艳", "马超", "朱琳", "胡军", "郭倩",
        "林峰", "何雪", "高翔", "罗雯", "郑宇", "梁欣", "谢涛", "唐萍",
        "韩冰", "冯丽", "董明", "萧然", "程亮", "蔡红"
    ]

    now = datetime.now()
    today = now.date()

    members_data = []
    for i in range(30):
        member_id = i + 1
        coach = random.choice(coaches)
        join_date = today - timedelta(days=random.randint(30, 365))
        expiry_date = today + timedelta(days=random.randint(-60, 90))
        last_visit = today - timedelta(days=random.randint(0, 30))

        members_data.append((
            member_id,
            f"M{2024000 + member_id}",
            member_names[i],
            f"138{random.randint(10000000, 99999999)}",
            random.choice(levels),
            "active" if expiry_date >= today else "expired",
            join_date,
            coach[0],
            coach[1],
            round(random.uniform(3000, 50000), 2),
            last_visit,
            expiry_date,
            30,
            now - timedelta(days=random.randint(30, 365))
        ))

    con.executemany("""
        INSERT INTO dim_member VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, members_data)

    memberships_data = []
    types = ["private_coaching", "group_class", "combo"]
    membership_names = {
        "private_coaching": ["私教30节课", "私教50节课", "私教100节课", "VIP私教套餐"],
        "group_class": ["团课月卡", "团课季卡", "团课年卡"],
        "combo": ["综合季卡", "综合半年卡", "综合年卡"]
    }

    for i, member in enumerate(members_data):
        member_id = member[0]
        expiry_date = member[11]
        num_memberships = random.randint(1, 3)

        for j in range(num_memberships):
            mtype = random.choice(types)
            mname = random.choice(membership_names[mtype])
            total_sessions = random.choice([12, 24, 36, 50, 100])
            used_sessions = random.randint(0, total_sessions)
            remaining = total_sessions - used_sessions
            unit_price = round(random.uniform(200, 500), 2)
            total_amount = round(unit_price * total_sessions, 2)
            start_date = expiry_date - timedelta(days=random.randint(60, 365))

            memberships_data.append((
                len(memberships_data) + 1,
                f"MS{20240000 + len(memberships_data) + 1}",
                member_id,
                mtype,
                mname,
                total_sessions,
                used_sessions,
                remaining,
                total_amount,
                unit_price,
                start_date,
                expiry_date,
                "active" if remaining > 0 and expiry_date >= today else ("used_up" if remaining == 0 else "expired"),
                1 if random.random() > 0.6 else 0,
                len(memberships_data) + 1,
                None if j == 0 else len(memberships_data),
                now - timedelta(days=random.randint(30, 300))
            ))

    con.executemany("""
        INSERT INTO dim_membership VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, memberships_data)

    transactions_data = []
    tx_types = ["purchase", "renewal", "refund"]
    payment_methods = ["wechat", "alipay", "cash", "card", "transfer"]
    sales_names = ["销售小王", "销售小李", "销售小张", "销售小陈"]
    cashier_names = ["收银A", "收银B", "收银C"]

    for i in range(80):
        member = random.choice(members_data)
        tx_type = random.choices(tx_types, weights=[0.4, 0.35, 0.25])[0]
        amount = round(random.uniform(2000, 20000), 2)
        discount = round(amount * random.uniform(0, 0.15), 2)
        actual = round(amount - discount, 2)

        if tx_type == "refund":
            actual = -actual

        tx_date = now - timedelta(
            days=random.randint(0, 90),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )

        transactions_data.append((
            i + 1,
            f"T{202400000 + i + 1}",
            member[0],
            random.choice(memberships_data)[0] if memberships_data else None,
            tx_type,
            amount,
            discount,
            actual,
            random.choice(payment_methods),
            "success",
            tx_date,
            tx_date.date(),
            None,
            None,
            random.choice(sales_names),
            None,
            random.choice(cashier_names),
            tx_date
        ))

    con.executemany("""
        INSERT INTO fact_transaction VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, transactions_data)

    records_data = []
    verif_types = ["course", "access", "manual"]
    operator_names = ["前台小王", "前台小李", "系统自动"]
    locations = ["一楼前台", "二楼前台", "私教区入口", "团课教室"]

    for i in range(200):
        member = random.choice(members_data)
        membership = random.choice(memberships_data)
        verify_time = now - timedelta(
            days=random.randint(0, 60),
            hours=random.randint(6, 22),
            minutes=random.randint(0, 59)
        )

        records_data.append((
            i + 1,
            f"CR{202400000 + i + 1}",
            member[0],
            membership[0],
            random.randint(1, 100),
            random.choice(verif_types),
            1,
            random.randint(5, 100),
            random.randint(4, 99),
            None,
            random.choice(operator_names),
            verify_time,
            verify_time.date(),
            f"DEV{random.randint(100, 999)}",
            random.choice(locations),
            verify_time
        ))

    con.executemany("""
        INSERT INTO fact_course_record VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records_data)

    access_data = []
    for i in range(300):
        member = random.choice(members_data)
        access_time = now - timedelta(
            days=random.randint(0, 60),
            hours=random.randint(6, 22),
            minutes=random.randint(0, 59)
        )

        access_data.append((
            i + 1,
            f"AR{202400000 + i + 1}",
            member[0],
            member[1],
            member[2],
            random.choice(["entry", "exit"]),
            access_time,
            access_time.date(),
            f"ACC{random.randint(100, 999)}",
            random.choice(["东门", "西门", "北门", "私教入口"]),
            random.choice(["人脸", "刷卡", "二维码"]),
            1,
            access_time
        ))

    con.executemany("""
        INSERT INTO fact_access VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, access_data)

    refund_reasons = [
        "injury", "move_away", "dissatisfied", "coach_change",
        "price_reason", "time_conflict", "health_reason", "other"
    ]
    refund_data = []
    for i in range(25):
        member = random.choice(members_data)
        reason = random.choice(refund_reasons)
        amount = round(random.uniform(1000, 15000), 2)
        sessions = random.randint(1, 30)
        penalty = round(amount * random.uniform(0, 0.2), 2)
        actual_refund = round(amount - penalty, 2)
        apply_date = now - timedelta(days=random.randint(0, 90))

        refund_data.append((
            i + 1,
            f"R{202400000 + i + 1}",
            member[0],
            random.choice(memberships_data)[0],
            random.choice(transactions_data)[0],
            reason,
            f"{reason}的详细说明",
            amount,
            sessions,
            penalty,
            actual_refund,
            random.choice(["pending", "approved", "completed"]),
            apply_date,
            apply_date.date(),
            apply_date + timedelta(days=random.randint(0, 5)),
            apply_date + timedelta(days=random.randint(3, 10)),
            None,
            random.choice(sales_names),
            None,
            random.choice(["经理A", "经理B"]),
            apply_date
        ))

    con.executemany("""
        INSERT INTO fact_refund VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, refund_data)

    note_sources = ["expiry_warning", "refund", "low_activity", "manual", "analysis"]
    note_statuses = ["pending", "in_progress", "resolved", "closed"]
    note_priorities = ["low", "medium", "high", "urgent"]
    note_titles = [
        "会员即将到期提醒",
        "会员退款跟进",
        "低活跃度会员激活",
        "续费意向确认",
        "会员满意度回访",
        "课程到期提醒跟进",
    ]

    notes_data = []
    for i in range(40):
        member = random.choice(members_data)
        source = random.choice(note_sources)
        status = random.choice(note_statuses)
        title = random.choice(note_titles)

        due_date = today + timedelta(days=random.randint(-10, 20))
        created_at = now - timedelta(days=random.randint(0, 30))

        notes_data.append((
            i + 1,
            f"NOTE{20240000 + i + 1}",
            member[0],
            random.choice(memberships_data)[0] if memberships_data else None,
            source,
            title,
            f"这是关于会员{member[2]}的续费跟进备注。需要联系确认续费意向。",
            "已联系会员，会员表示考虑中，下周给答复。" if status == "resolved" else None,
            status,
            random.choice(note_priorities),
            due_date,
            None,
            random.choice(coaches)[1],
            None,
            "系统自动",
            None if status != "resolved" else random.choice(coaches)[0],
            None if status != "resolved" else random.choice(coaches)[1],
            created_at + timedelta(days=random.randint(1, 5)) if status == "resolved" else None,
            random.choice(["expiring_members", "contacted_members", "refund", None]),
            random.choice(["renewal_rate", "conversion_rate", None]),
            created_at
        ))

    con.executemany("""
        INSERT INTO fact_renewal_note VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, notes_data)

    con.close()
    print("Mock 数据生成完成！")


if __name__ == "__main__":
    generate_mock_data()
