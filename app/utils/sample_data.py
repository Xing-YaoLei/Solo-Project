import random
from datetime import datetime, timedelta, date
from app.database import SessionLocal
from app.models import (
    Activity, TicketType, Sponsor, Registration,
    Payment, GateRecord, Remark
)


def generate_sample_data():
    db = SessionLocal()

    try:
        print("开始生成示例数据...")

        activity = Activity(
            name="2024 夏季音乐节",
            activity_type="演出",
            venue="国家体育场（鸟巢）",
            start_date=date(2024, 8, 15),
            end_date=date(2024, 8, 15),
            description="年度最盛大的音乐盛典，汇聚国内外知名音乐人",
            status="active",
        )
        db.add(activity)
        db.flush()

        activity2 = Activity(
            name="科技产品发布会",
            activity_type="活动",
            venue="国际会议中心",
            start_date=date(2024, 9, 10),
            end_date=date(2024, 9, 12),
            description="最新科技产品全球首发",
            status="active",
        )
        db.add(activity2)
        db.flush()

        vip_ticket = TicketType(
            activity_id=activity.id,
            name="VIP 内场票",
            price=1280.0,
            total_quantity=500,
            ticket_category="VIP",
            description="内场最佳观演位置，含专属休息区",
            is_refundable=True,
        )
        standard_ticket = TicketType(
            activity_id=activity.id,
            name="标准看台票",
            price=580.0,
            total_quantity=3000,
            ticket_category="普通",
            description="标准看台观演位",
            is_refundable=True,
        )
        student_ticket = TicketType(
            activity_id=activity.id,
            name="学生优惠票",
            price=280.0,
            total_quantity=500,
            ticket_category="学生",
            description="凭学生证入场",
            is_refundable=False,
        )
        db.add_all([vip_ticket, standard_ticket, student_ticket])
        db.flush()

        sponsors = [
            Sponsor(
                activity_id=activity.id,
                name="星辰科技",
                sponsor_level="冠名赞助商",
                allocated_tickets=200,
                contact_person="张经理",
                contact_phone="13800138001",
                remark="战略合作客户，需预留最佳位置",
            ),
            Sponsor(
                activity_id=activity.id,
                name="蓝天集团",
                sponsor_level="特约赞助商",
                allocated_tickets=100,
                contact_person="李总",
                contact_phone="13900139002",
                remark="长期合作伙伴",
            ),
            Sponsor(
                activity_id=activity.id,
                name="彩虹传媒",
                sponsor_level="一般赞助商",
                allocated_tickets=50,
                contact_person="王女士",
                contact_phone="13700137003",
            ),
            Sponsor(
                activity_id=activity.id,
                name="绿野户外",
                sponsor_level="一般赞助商",
                allocated_tickets=30,
                contact_person="陈先生",
                contact_phone="13600136004",
            ),
        ]
        db.add_all(sponsors)
        db.flush()

        first_names = ["张", "李", "王", "刘", "陈", "杨", "黄", "赵", "周", "吴", "徐", "孙", "马", "朱", "胡"]
        last_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "洋", "艳", "勇", "军", "杰", "涛", "明"]

        ticket_types = [vip_ticket, standard_ticket, student_ticket]
        sponsor_list = sponsors

        order_counter = 1
        for i in range(200):
            ticket_type = random.choice(ticket_types)
            sponsor = random.choice(sponsor_list + [None])
            quantity = random.choice([1, 1, 1, 2, 2, 3, 4])
            total_amount = ticket_type.price * quantity

            status = random.choice(["paid", "paid", "paid", "paid", "pending", "refunded"])
            is_disputed = status == "refunded" and random.random() < 0.3

            register_time = datetime(2024, random.randint(6, 7), random.randint(1, 28),
                                     random.randint(9, 22), random.randint(0, 59))

            customer_name = random.choice(first_names) + random.choice(last_names)
            customer_phone = "1" + str(random.choice([3, 5, 7, 8, 9])) + "".join(
                [str(random.randint(0, 9)) for _ in range(9)]
            )

            registration = Registration(
                activity_id=activity.id,
                ticket_type_id=ticket_type.id,
                sponsor_id=sponsor.id if sponsor else None,
                order_no=f"ORD{20240815:08d}{order_counter:06d}",
                customer_name=customer_name,
                customer_phone=customer_phone,
                quantity=quantity,
                total_amount=total_amount,
                status=status,
                is_disputed=is_disputed,
                dispute_reason="演出时间变更需退票" if is_disputed else None,
                register_time=register_time,
            )
            db.add(registration)
            order_counter += 1

        db.flush()

        paid_registrations = db.query(Registration).filter(
            Registration.activity_id == activity.id,
            Registration.status == "paid",
        ).all()

        for reg in paid_registrations:
            payment_time = reg.register_time + timedelta(minutes=random.randint(1, 120))
            payment = Payment(
                registration_id=reg.id,
                payment_no=f"PAY{payment_time.strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}",
                amount=reg.total_amount,
                payment_method=random.choice(["wechat", "alipay", "bank"]),
                payment_status="success",
                payment_time=payment_time,
                channel_order_no=f"CHN{random.randint(100000000000, 999999999999)}",
                sync_source="sample_data",
                sync_time=datetime.now(),
            )
            db.add(payment)

        refunded_registrations = db.query(Registration).filter(
            Registration.activity_id == activity.id,
            Registration.status == "refunded",
        ).all()

        for reg in refunded_registrations:
            payment_time = reg.register_time + timedelta(minutes=random.randint(1, 60))
            refund_time = payment_time + timedelta(days=random.randint(1, 10))
            payment = Payment(
                registration_id=reg.id,
                payment_no=f"PAY{payment_time.strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}",
                amount=reg.total_amount,
                payment_method=random.choice(["wechat", "alipay"]),
                payment_status="refunded",
                payment_time=payment_time,
                refund_time=refund_time,
                refund_amount=reg.total_amount,
                channel_order_no=f"CHN{random.randint(100000000000, 999999999999)}",
                sync_source="sample_data",
                sync_time=datetime.now(),
            )
            db.add(payment)

        db.flush()

        checkin_registrations = random.sample(paid_registrations, int(len(paid_registrations) * 0.85))

        for idx, reg in enumerate(checkin_registrations):
            check_in_time = datetime(2024, 8, 15, random.randint(18, 21), random.randint(0, 59))
            gate_record = GateRecord(
                registration_id=reg.id,
                ticket_code=f"TCK{reg.id:08d}{idx:04d}",
                gate_no=random.choice(["G01", "G02", "G03", "G04"]),
                check_in_time=check_in_time,
                check_in_type="entry",
                operator=random.choice(["staff1", "staff2", "staff3", "staff4"]),
                is_valid=True,
                sync_source="sample_data",
                sync_time=datetime.now(),
            )
            db.add(gate_record)

        invalid_gate_records = [
            GateRecord(
                registration_id=random.choice(paid_registrations).id,
                ticket_code=f"TCKINV{idx:06d}",
                gate_no=random.choice(["G01", "G02"]),
                check_in_time=datetime(2024, 8, 15, random.randint(18, 21), random.randint(0, 59)),
                check_in_type="entry",
                operator=random.choice(["staff1", "staff2"]),
                is_valid=False,
                invalid_reason=random.choice(["票已使用", "票已过期", "票号不存在"]),
                sync_source="sample_data",
                sync_time=datetime.now(),
            )
            for idx in range(5)
        ]
        db.add_all(invalid_gate_records)

        remarks = [
            Remark(
                target_type="chart",
                target_id="funnel_chart",
                content="本周五团队例会重点关注核销率，目标提升5%",
                created_by="运营主管",
            ),
            Remark(
                target_type="chart",
                target_id="funnel_chart",
                content="赞助票核销率偏低，建议提前联系赞助商确认到场人数",
                created_by="客户经理",
            ),
            Remark(
                target_type="activity",
                target_id="1",
                content="活动整体进度良好，需关注学生票销售情况",
                created_by="项目经理",
            ),
        ]
        db.add_all(remarks)

        db.commit()
        print("示例数据生成完成！")
        print(f"活动数: {db.query(Activity).count()}")
        print(f"票种数: {db.query(TicketType).count()}")
        print(f"赞助商数: {db.query(Sponsor).count()}")
        print(f"报名订单数: {db.query(Registration).count()}")
        print(f"支付记录数: {db.query(Payment).count()}")
        print(f"核销记录数: {db.query(GateRecord).count()}")

    except Exception as e:
        db.rollback()
        print(f"生成示例数据失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_sample_data()
