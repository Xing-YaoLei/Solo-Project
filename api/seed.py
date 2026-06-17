import asyncio
import random
from datetime import datetime, timedelta

from api.auth import get_password_hash
from api.database import Base, async_session_factory, engine
from api.models import (
    BatchItem,
    CaliberNote,
    Exception,
    ExportRecord,
    InsuranceRecord,
    MemberProfile,
    Prescription,
    PrescriptionCaliberNote,
    PrescriptionPhoto,
    Region,
    Replenishment,
    Store,
    TimelineEvent,
    User,
)


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        regions_data = [
            {"name": "华东区", "code": "HD", "manager_name": "张华东"},
            {"name": "华北区", "code": "HB", "manager_name": "李华北"},
            {"name": "华南区", "code": "HN", "manager_name": "王华南"},
        ]
        regions = []
        for rd in regions_data:
            r = Region(**rd)
            db.add(r)
            regions.append(r)
        await db.flush()

        stores_data = [
            {"region_id": regions[0].id, "name": "益丰药房-南京路店", "code": "HD-NJ-001", "address": "南京市南京路100号", "phone": "025-88001001"},
            {"region_id": regions[0].id, "name": "益丰药房-上海路店", "code": "HD-SH-001", "address": "上海市上海路200号", "phone": "021-66001002"},
            {"region_id": regions[1].id, "name": "益丰药房-朝阳店", "code": "HB-BJ-001", "address": "北京市朝阳区朝阳路50号", "phone": "010-88001003"},
            {"region_id": regions[1].id, "name": "益丰药房-海淀店", "code": "HB-BJ-002", "address": "北京市海淀区中关村路30号", "phone": "010-88001004"},
            {"region_id": regions[2].id, "name": "益丰药房-天河店", "code": "HN-GZ-001", "address": "广州市天河区天河路80号", "phone": "020-88001005"},
            {"region_id": regions[2].id, "name": "益丰药房-福田店", "code": "HN-SZ-001", "address": "深圳市福田区深南大道60号", "phone": "0755-88001006"},
        ]
        stores = []
        for sd in stores_data:
            s = Store(**sd)
            db.add(s)
            stores.append(s)
        await db.flush()

        users_data = [
            {"store_id": stores[0].id, "username": "admin", "display_name": "系统管理员", "role": "admin"},
            {"store_id": stores[0].id, "username": "rm_hd", "display_name": "张华东", "role": "regional_manager"},
            {"store_id": stores[2].id, "username": "rm_hb", "display_name": "李华北", "role": "regional_manager"},
            {"store_id": stores[4].id, "username": "rm_hn", "display_name": "王华南", "role": "regional_manager"},
            {"store_id": stores[0].id, "username": "sm_nj001", "display_name": "陈店长", "role": "store_manager"},
            {"store_id": stores[2].id, "username": "sm_bj001", "display_name": "赵店长", "role": "store_manager"},
            {"store_id": stores[0].id, "username": "pharm_zhang", "display_name": "张药师", "role": "pharmacist"},
            {"store_id": stores[1].id, "username": "pharm_li", "display_name": "李药师", "role": "pharmacist"},
            {"store_id": stores[2].id, "username": "pharm_wang", "display_name": "王药师", "role": "pharmacist"},
            {"store_id": stores[4].id, "username": "pharm_liu", "display_name": "刘药师", "role": "pharmacist"},
        ]
        users = []
        for ud in users_data:
            u = User(**ud, hashed_password=get_password_hash("password123"))
            db.add(u)
            users.append(u)
        await db.flush()

        member_names = [
            "张三", "李四", "王五", "赵六", "钱七",
            "孙八", "周九", "吴十", "郑十一", "冯十二",
            "陈十三", "褚十四", "卫十五", "蒋十六", "沈十七",
            "韩十八", "杨十九", "朱二十", "秦二一", "尤二二",
        ]
        members = []
        for i, name in enumerate(member_names):
            m = MemberProfile(
                name=name,
                id_number=f"310{100 + i:06d}0000{i + 1:04d}",
                phone=f"138{10000000 + i:08d}",
                gender=random.choice(["男", "女"]),
                date_of_birth=datetime(1960 + i % 30, 1 + i % 12, 1 + i % 28),
                address=f"某市某区某街道{i + 1}号",
            )
            db.add(m)
            members.append(m)
        await db.flush()

        diagnoses = ["高血压", "糖尿病", "冠心病", "哮喘", "胃溃疡", "甲亢", "高血脂", "失眠", "关节炎", "支气管炎"]
        drug_names = ["氨氯地平片", "二甲双胍片", "阿托伐他汀钙片", "氯吡格雷片", "奥美拉唑胶囊",
                       "沙美特罗替卡松粉吸入剂", "甲巯咪唑片", "艾司唑仑片", "布洛芬缓释胶囊", "阿莫西林胶囊"]
        statuses = ["pending", "in_review", "approved", "rejected", "exception"]
        priorities = ["normal", "urgent", "critical"]

        prescriptions = []
        now = datetime.utcnow()
        for i in range(20):
            status_val = statuses[i % len(statuses)]
            priority_val = priorities[i % len(priorities)] if i % 3 == 0 else "normal"
            store = stores[i % len(stores)]
            member = members[i % len(members)]
            reviewer = users[6 + (i % 4)] if status_val in ("approved", "rejected", "in_review", "exception") else None
            reviewed_at = now - timedelta(hours=random.randint(1, 48)) if reviewer else None

            rx = Prescription(
                store_id=store.id,
                member_id=member.id,
                rx_number=f"RX{2024}{i + 1:06d}",
                status=status_val,
                priority=priority_val,
                diagnosis=diagnoses[i % len(diagnoses)],
                total_amount=round(random.uniform(50, 500), 2),
                reviewer_id=reviewer.id if reviewer else None,
                reviewed_at=reviewed_at,
                created_at=now - timedelta(days=random.randint(1, 30)),
            )
            db.add(rx)
            prescriptions.append(rx)
        await db.flush()

        for rx in prescriptions:
            event_type = "created"
            to_status = "pending"
            if rx.status != "pending":
                event = TimelineEvent(
                    prescription_id=rx.id,
                    event_type="status_change",
                    from_status="pending",
                    to_status="in_review",
                    description="状态变更: pending -> in_review",
                    performed_by=rx.reviewer_id or users[0].id,
                )
                db.add(event)
            if rx.status in ("approved", "rejected", "exception"):
                event2 = TimelineEvent(
                    prescription_id=rx.id,
                    event_type="status_change",
                    from_status="in_review",
                    to_status=rx.status,
                    description=f"状态变更: in_review -> {rx.status}",
                    performed_by=rx.reviewer_id or users[0].id,
                )
                db.add(event2)
            event0 = TimelineEvent(
                prescription_id=rx.id,
                event_type="created",
                to_status="pending",
                description="处方创建",
                performed_by=users[6 + (prescriptions.index(rx) % 4)].id,
            )
            db.add(event0)
        await db.flush()

        for rx in prescriptions:
            for j in range(random.randint(1, 3)):
                drug_idx = random.randint(0, len(drug_names) - 1)
                qty = random.randint(1, 5)
                price = round(random.uniform(10, 100), 2)
                item = BatchItem(
                    prescription_id=rx.id,
                    drug_name=drug_names[drug_idx],
                    drug_code=f"DRG{drug_idx:04d}",
                    specification=f"{random.randint(5, 20)}mg",
                    quantity=qty,
                    unit="盒",
                    dosage=f"每次{random.randint(1, 3)}片",
                    frequency="每日3次",
                    duration_days=random.randint(3, 14),
                    unit_price=price,
                    subtotal=round(qty * price, 2),
                )
                db.add(item)
        await db.flush()

        for rx in prescriptions[:8]:
            repl = Replenishment(
                prescription_id=rx.id,
                drug_name=drug_names[random.randint(0, len(drug_names) - 1)],
                drug_code=f"DRG{random.randint(0, 9):04d}",
                quantity=random.randint(1, 3),
                reason="库存不足，需补货",
                status=random.choice(["pending", "fulfilled"]),
            )
            db.add(repl)
        await db.flush()

        for rx in prescriptions[:10]:
            ins = InsuranceRecord(
                prescription_id=rx.id,
                insurance_type=random.choice(["城镇职工医保", "城乡居民医保", "商业保险"]),
                policy_number=f"INS{random.randint(100000, 999999)}",
                coverage_ratio=round(random.uniform(0.5, 0.9), 2),
                covered_amount=round(rx.total_amount * 0.7, 2),
                self_pay_amount=round(rx.total_amount * 0.3, 2),
                verified=random.choice([True, False]),
            )
            db.add(ins)
        await db.flush()

        exception_types = ["药物相互作用", "剂量超限", "禁忌症冲突", "重复用药", "医保审核异常"]
        exception_rx = [rx for rx in prescriptions if rx.status == "exception"]
        for i, rx in enumerate(exception_rx):
            exc = Exception(
                prescription_id=rx.id,
                exception_type=exception_types[i % len(exception_types)],
                severity=random.choice(["low", "medium", "high", "critical"]),
                impact_scope=random.choice(["单张处方", "同门店处方", "同区域处方", "全连锁"]),
                description=f"发现{exception_types[i % len(exception_types)]}问题，需要人工审核确认",
                assignee_id=users[6 + (i % 4)].id,
                status=random.choice(["open", "in_progress"]),
            )
            db.add(exc)

        for rx in prescriptions[:3]:
            exc = Exception(
                prescription_id=rx.id,
                exception_type=random.choice(exception_types),
                severity="low",
                impact_scope="单张处方",
                description="历史异常记录，已处理",
                assignee_id=users[6].id,
                status="resolved",
                resolution="经确认无误，已关闭",
            )
            db.add(exc)
        await db.flush()

        for rx in prescriptions[:5]:
            note = PrescriptionCaliberNote(
                prescription_id=rx.id,
                content=f"审核备注：注意核对{rx.diagnosis}相关药物用法用量",
                category="review_note",
                created_by=users[6 + (prescriptions.index(rx) % 4)].id,
            )
            db.add(note)
        await db.flush()

        caliber_notes_data = [
            {
                "metric": "处方审核通过率",
                "definition": "统计周期内，通过审核的处方数量占所有提交审核处方数量的比例。计算公式：审核通过处方数 ÷ 提交审核处方总数 × 100%",
                "exclusions": [
                    "已作废的处方不计入统计",
                    "草稿状态的处方不计入统计",
                    "测试环境生成的处方数据需排除",
                ],
                "remarks": "按月度、季度、年度进行统计分析，可按区域、门店维度进行钻取",
            },
            {
                "metric": "平均审核时长",
                "definition": "从处方提交审核开始到审核完成（通过或驳回）的平均耗时。计算公式：Σ(审核完成时间 - 提交时间) ÷ 已审核处方总数",
                "exclusions": [
                    "超过72小时未审核的处方不计入",
                    "异常状态处方不计入",
                    "自动审核通过的处方需单独统计",
                ],
                "remarks": "时间单位为小时，支持按时间段、审核人员、门店等维度分析",
            },
            {
                "metric": "医保匹配率",
                "definition": "处方中成功匹配医保目录并完成结算的药品项占所有药品项的比例。计算公式：医保结算成功药品项数 ÷ 处方药品项总数 × 100%",
                "exclusions": [
                    "自费处方不计入统计",
                    "医保结算失败的药品项不计入匹配成功",
                    "特药、高价药需单独统计",
                ],
                "remarks": "可按医保类型、药品类别、门店等维度进行对比分析",
            },
            {
                "metric": "异常处理时效",
                "definition": "从处方标记为异常开始到异常处理完成（解决或关闭）的平均耗时。计算公式：Σ(异常处理完成时间 - 异常标记时间) ÷ 已处理异常总数",
                "exclusions": [
                    "超过7天未处理的异常不计入",
                    "误报异常且直接关闭的不计入",
                    "跨系统流转的异常需分段统计",
                ],
                "remarks": "时间单位为小时，可按异常类型、严重程度、处理人员等维度分析",
            },
        ]

        for cnd in caliber_notes_data:
            cn = CaliberNote(**cnd)
            db.add(cn)
        await db.flush()

        await db.commit()
        print("✅ 种子数据创建完成!")
        print(f"  - {len(regions)} 个区域")
        print(f"  - {len(stores)} 个门店")
        print(f"  - {len(users)} 个用户")
        print(f"  - {len(members)} 个会员")
        print(f"  - {len(prescriptions)} 张处方")


if __name__ == "__main__":
    asyncio.run(seed())
