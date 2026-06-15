import sys
import os
from datetime import datetime, date, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import (
    User, MemberProfile, BenefitRule, MemberBenefitMapping,
    AccountTransaction, CommunityTicket, AuditLog, ReviewRecord,
    TicketBenefitReference, PlagiarismCase
)
from app.enums import (
    TicketStatus, TicketSource, ReviewTag,
    TransactionType, PlagiarismStatus, PlagiarismSeverity, MemberLevel
)


def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🌱 开始初始化数据库...")

        print("  -> 创建用户...")
        users = []
        user_data = [
            ("admin", "系统管理员", "admin@test.com", "administrator"),
            ("zhangsan", "张三", "zhangsan@test.com", "operator"),
            ("lisi", "李四", "lisi@test.com", "reviewer"),
            ("wangwu", "王五", "wangwu@test.com", "senior_reviewer"),
            ("zhaoliu", "赵六", "zhaoliu@test.com", "operator"),
        ]
        for i, (uname, fname, email, role) in enumerate(user_data):
            u = User(
                username=uname,
                full_name=fname,
                email=email,
                role=role,
                hashed_password=f"hashed_{uname}",
            )
            db.add(u)
            users.append(u)
        db.flush()

        print("  -> 创建会员档案...")
        member_levels = list(MemberLevel)
        sources = list(TicketSource)
        names = [
            "陈小明", "刘小红", "杨阳", "黄磊", "周杰",
            "吴芳", "徐强", "孙丽华", "马超", "朱琳",
            "胡建国", "郭文静", "何欣", "高鹏飞", "林雪",
            "宋佳", "唐亮", "韩梅", "冯涛", "邓萍",
        ]
        members = []
        for i in range(20):
            exam_score = round(random.uniform(45, 98), 1)
            m = MemberProfile(
                member_no=f"M2026{str(i+1).zfill(5)}",
                name=names[i],
                phone=f"138{random.randint(10000000, 99999999)}",
                email=f"member{i+1}@test.com",
                id_card=f"110101{19900000 + random.randint(10000, 99999)}1234",
                level=random.choice(member_levels),
                source_channel=random.choice(sources),
                join_date=date.today() - timedelta(days=random.randint(10, 200)),
                exam_score=exam_score,
                exam_pass_status=exam_score >= 60,
                exam_date=date.today() - timedelta(days=random.randint(5, 90)),
                total_learning_hours=round(random.uniform(10, 300), 1),
                community_group=f"社群{random.choice(['A','B','C','D','E'])}班",
                tags=random.sample(["优秀学员", "活跃", "待跟进", "已推荐", "考试达人", "续报意向"], k=random.randint(0, 3)),
                remark=random.choice(["", "", "", "学习态度认真", "需要重点跟进", "有意向续报高阶课程"]),
            )
            db.add(m)
            members.append(m)
        db.flush()

        print("  -> 创建权益规则...")
        benefit_data = [
            ("BEN001", "新人专属折扣券", "新人专享9折优惠", "discount", [MemberLevel.BASIC, MemberLevel.SILVER], 0.9, 0, 0.0),
            ("BEN002", "金牌会员现金返现", "每笔订单返现5%", "cashback", [MemberLevel.GOLD, MemberLevel.PLATINUM], 0, 0, 100.0),
            ("BEN003", "钻石会员双倍积分", "消费积分双倍发放", "points", [MemberLevel.DIAMOND], 0, 2000, 0.0),
            ("BEN004", "续报立减500元", "老学员续报立减", "discount", list(MemberLevel), 0, 0, 500.0),
            ("BEN005", "免费补考机会", "未通过者免费补考一次", "service", list(MemberLevel), 0, 0, 299.0),
            ("BEN006", "1对1答疑服务", "每月2次1对1答疑", "service", [MemberLevel.GOLD, MemberLevel.PLATINUM, MemberLevel.DIAMOND], 0, 0, 399.0),
            ("BEN007", "推荐奖励", "推荐新学员奖励", "bonus", list(MemberLevel), 0, 500, 200.0),
            ("BEN008", "社群专属资料包", "独家学习资料", "material", list(MemberLevel), 0, 100, 99.0),
        ]
        benefits = []
        for code, name, desc, btype, levels, discount, points, cash in benefit_data:
            b = BenefitRule(
                rule_code=code,
                rule_name=name,
                description=desc,
                benefit_type=btype,
                applicable_levels=[l.value for l in levels],
                discount_rate=discount,
                bonus_points=points,
                cash_value=cash,
                valid_from=date.today() - timedelta(days=365),
                valid_until=date.today() + timedelta(days=365),
                is_active=True,
                conditions={"min_spent": random.choice([0, 1000, 3000, 5000])},
            )
            db.add(b)
            benefits.append(b)
        db.flush()

        print("  -> 创建会员权益映射...")
        for m in members:
            member_level_idx = member_levels.index(m.level)
            applicable = [b for b in benefits if m.level.value in b.applicable_levels]
            for b in random.sample(applicable, k=min(random.randint(1, 4), len(applicable))):
                mb = MemberBenefitMapping(
                    member_id=m.id,
                    benefit_id=b.id,
                    granted_date=date.today() - timedelta(days=random.randint(5, 150)),
                    used_count=random.randint(0, 5),
                    max_usage=random.choice([1, 3, 5, 10]),
                    is_active=random.random() > 0.15,
                )
                db.add(mb)

        print("  -> 创建社群单据...")
        statuses = list(TicketStatus)
        categories = ["课程咨询", "缴费办理", "考试报名", "续报跟进", "转介绍", "权益申诉", "学习辅导", "其他"]
        titles = [
            "Python数据分析班续报跟进", "UI设计实战班学员社群维护", "Java架构师课程答疑处理",
            "产品经理训练营缴费办理", "前端全栈班考试报名", "短视频运营班转介绍奖励申请",
            "跨境电商班权益申诉处理", "AI人工智能班学习辅导", "会计考证班补考申请",
            "新媒体运营班奖学金申请", "PMP项目管理班课程退款", "人力资源管理师班调班申请",
            "心理咨询师班作业问题处理", "教师资格证班资料补发", "建造师考试班VIP升级申请",
            "执业药师班社群跟进", "法律职业资格班疑难解答", "考研英语班学习进度跟踪",
            "公务员考试班模考分析", "雅思7分冲刺班口语辅导",
        ]
        tickets = []
        for i in range(30):
            member = random.choice(members)
            creator = random.choice(users)
            responsible = random.choice(users[1:])
            status = random.choices(
                statuses,
                weights=[2, 4, 4, 3, 2, 3, 8, 3],
                k=1
            )[0]
            t = CommunityTicket(
                ticket_no=f"TK{datetime.now().strftime('%Y%m%d')}{str(i+1).zfill(6)}",
                title=titles[i % len(titles)],
                member_id=member.id,
                source=random.choice(sources),
                status=status,
                creator_id=creator.id,
                responsible_id=responsible.id,
                category=random.choice(categories),
                priority=random.randint(1, 5),
                description=f"这是单据{i+1}的详细描述。涉及学员{member.name}的相关问题，请相关人员尽快处理。\n\n问题背景：\n1. 学员在学习过程中遇到困难\n2. 需要社群跟进和辅导\n3. 涉及权益确认",
                evidence_urls=[f"https://cdn.example.com/evidence/{i}/file{j}.pdf" for j in range(random.randint(0, 4))],
                supplement_requirements="需要补充：成绩单扫描件" if status == TicketStatus.SUPPLEMENT_NEEDED else None,
                closed_at=datetime.now() - timedelta(days=random.randint(1, 30)) if status == TicketStatus.CLOSED else None,
                close_remark="处理完成，学员满意" if status == TicketStatus.CLOSED else None,
                review_tag=random.choice(list(ReviewTag)) if status in [TicketStatus.COMPLETED, TicketStatus.CLOSED] else None,
                review_score=random.randint(60, 100) if status in [TicketStatus.COMPLETED, TicketStatus.CLOSED] else None,
                review_remark="处理过程规范，跟进及时" if status in [TicketStatus.COMPLETED, TicketStatus.CLOSED] else None,
                created_at=datetime.now() - timedelta(days=random.randint(1, 60)),
            )
            db.add(t)
            tickets.append(t)
        db.flush()

        print("  -> 创建单据权益引用...")
        for t in tickets:
            if random.random() > 0.3:
                member = next(m for m in members if m.id == t.member_id)
                applicable = [b for b in benefits if member.level.value in b.applicable_levels]
                for b in random.sample(applicable, k=min(random.randint(1, 3), len(applicable))):
                    tbr = TicketBenefitReference(
                        ticket_id=t.id,
                        benefit_id=b.id,
                        applied_value=b.cash_value or float(b.bonus_points or 0) * 0.1,
                        remark=random.choice(["单据关联权益", "办理时申请", "客户主动询问", ""]),
                    )
                    db.add(tbr)

        print("  -> 创建账户流水...")
        trans_types = list(TransactionType)
        txns = []
        for i in range(60):
            ticket = random.choice(tickets)
            member = next(m for m in members if m.id == ticket.member_id)
            ttype = random.choice(trans_types)
            amount = {
                TransactionType.PAYMENT: abs(random.randint(1000, 20000)),
                TransactionType.REFUND: -abs(random.randint(500, 10000)),
                TransactionType.COMMISSION: random.randint(100, 2000),
                TransactionType.DEDUCTION: -random.randint(100, 1500),
                TransactionType.BONUS: random.randint(50, 3000),
            }[ttype]
            txn = AccountTransaction(
                transaction_no=f"TX{datetime.now().strftime('%Y%m%d')}{str(i+1).zfill(8)}",
                member_id=member.id,
                ticket_id=ticket.id if random.random() > 0.2 else None,
                type=ttype,
                amount=float(amount),
                balance_after=round(random.uniform(0, 50000), 2),
                payment_method=random.choice(["微信支付", "支付宝", "银行转账", "对公账户", ""]),
                related_order_no=f"ORD{random.randint(100000, 999999)}" if random.random() > 0.3 else None,
                description=random.choice([
                    "课程费用支付", "押金退还", "推荐佣金", "资料费扣款", "学习奖励",
                    "续报缴费", "补考费", "活动返现", "违约金扣除", "奖学金发放",
                ]),
                evidence_urls=[f"https://cdn.example.com/transactions/{i}/receipt.pdf"] if random.random() > 0.5 else [],
                transaction_date=datetime.now() - timedelta(days=random.randint(0, 90)),
                operator_id=random.choice(users).id,
            )
            db.add(txn)
            txns.append(txn)

        print("  -> 创建审计日志...")
        for t in tickets:
            prev_status = TicketStatus.DRAFT
            status_flow = [TicketStatus.DRAFT]
            target = t.status
            flow_map = {
                TicketStatus.DRAFT: [TicketStatus.DRAFT],
                TicketStatus.PENDING_REVIEW: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW],
                TicketStatus.REVIEWING: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING],
                TicketStatus.SUPPLEMENT_NEEDED: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING, TicketStatus.SUPPLEMENT_NEEDED],
                TicketStatus.ESCALATED_REVIEW: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING, TicketStatus.ESCALATED_REVIEW],
                TicketStatus.PROCESSING: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING, TicketStatus.PROCESSING],
                TicketStatus.COMPLETED: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING, TicketStatus.PROCESSING, TicketStatus.COMPLETED],
                TicketStatus.CLOSED: [TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING, TicketStatus.PROCESSING, TicketStatus.COMPLETED, TicketStatus.CLOSED],
            }
            status_flow = flow_map.get(target, [TicketStatus.DRAFT, target])
            for j in range(1, len(status_flow)):
                old = status_flow[j-1]
                new = status_flow[j]
                actions = {
                    (TicketStatus.DRAFT, TicketStatus.PENDING_REVIEW): "提交审核",
                    (TicketStatus.PENDING_REVIEW, TicketStatus.REVIEWING): "开始审核",
                    (TicketStatus.REVIEWING, TicketStatus.SUPPLEMENT_NEEDED): "要求补资料",
                    (TicketStatus.REVIEWING, TicketStatus.ESCALATED_REVIEW): "升级复核",
                    (TicketStatus.REVIEWING, TicketStatus.PROCESSING): "审核通过",
                    (TicketStatus.SUPPLEMENT_NEEDED, TicketStatus.PENDING_REVIEW): "资料补充完毕",
                    (TicketStatus.ESCALATED_REVIEW, TicketStatus.PROCESSING): "高级审核通过",
                    (TicketStatus.PROCESSING, TicketStatus.COMPLETED): "处理完成",
                    (TicketStatus.COMPLETED, TicketStatus.CLOSED): "关闭单据",
                    (TicketStatus.PROCESSING, TicketStatus.CLOSED): "直接关闭",
                }
                log = AuditLog(
                    ticket_id=t.id,
                    operator_id=random.choice(users).id,
                    action=actions.get((old, new), f"{old.value}->{new.value}"),
                    old_status=old.value,
                    new_status=new.value,
                    comment=random.choice([
                        "",
                        "信息核对无误",
                        "需要补充相关证明材料",
                        "涉及金额较大，需升级复核",
                        "跟进完成，学员确认满意",
                        "处理流程规范，可归档",
                    ]),
                    evidence_urls=[f"https://cdn.example.com/audit/{t.id}/{j}.png"] if random.random() > 0.6 else [],
                    reference_ids=random.sample([x.id for x in tickets if x.id != t.id], k=random.randint(0, 2)) if random.random() > 0.7 else [],
                    created_at=t.created_at + timedelta(days=random.randint(0, 3), hours=random.randint(1, 12)),
                )
                db.add(log)

        print("  -> 创建复盘记录...")
        review_tags = list(ReviewTag)
        for t in tickets:
            if t.status in [TicketStatus.COMPLETED, TicketStatus.CLOSED] or random.random() > 0.6:
                rounds = random.randint(1, 3)
                for r in range(1, rounds + 1):
                    rr = ReviewRecord(
                        ticket_id=t.id,
                        reviewer_id=random.choice(users[1:]).id,
                        round=r,
                        is_escalated=(r > 1),
                        review_tag=random.choice(review_tags),
                        score=random.randint(50, 100),
                        summary=random.choice([
                            "整体处理流程顺畅，响应及时。",
                            "学员配合度高，问题解决效果好。",
                            "沟通环节仍有提升空间。",
                            "资料准备充分，审核一次通过。",
                            "涉及多方协调，处理周期略长。",
                        ]),
                        evidence_urls=random.sample(
                            [f"https://cdn.example.com/review/{t.id}/{k}.pdf" for k in range(10)],
                            k=random.randint(0, 3)
                        ),
                        cited_transaction_ids=random.sample(
                            [x.id for x in txns], k=random.randint(0, 3)
                        ),
                        cited_benefit_ids=random.sample(
                            [b.id for b in benefits], k=random.randint(0, 2)
                        ),
                        follow_up_actions=random.sample([
                            "7天内回访确认满意度",
                            "14天后跟进续报意向",
                            "添加至重点维护名单",
                            "邀请参与优秀学员分享",
                            "赠送学习资料包",
                        ], k=random.randint(0, 3)),
                        created_at=t.created_at + timedelta(days=random.randint(2, 10)),
                    )
                    db.add(rr)

        print("  -> 创建作业抄袭案例...")
        plag_statuses = list(PlagiarismStatus)
        severities = list(PlagiarismSeverity)
        assignments = [
            ("Python数据分析实战第3章综合作业", "Python数据分析实战班（2026春季）"),
            ("UI设计-电商首页设计稿", "UI设计全栈实战班"),
            ("Java高并发编程课后作业", "Java架构师训练营"),
            ("产品需求文档(PRD)撰写", "产品经理全能班"),
            ("React组件开发作业", "前端全栈工程师班"),
            ("短视频脚本创作与剪辑", "短视频运营变现班"),
            ("跨境电商选品分析报告", "跨境电商运营实战班"),
            ("机器学习模型调优作业", "AI人工智能工程师班"),
            ("会计实务综合案例分析", "初级会计职称考试班"),
            ("微信公众号内容排版设计", "新媒体运营实操班"),
        ]
        for i in range(15):
            member = random.choice(members)
            ticket = random.choice(tickets) if random.random() > 0.3 else None
            status = random.choices(
                plag_statuses,
                weights=[2, 4, 3, 2, 1, 3],
                k=1
            )[0]
            p = PlagiarismCase(
                case_no=f"PLAG{datetime.now().strftime('%Y%m%d')}{str(i+1).zfill(6)}",
                member_id=member.id,
                ticket_id=ticket.id if ticket else None,
                reporter_id=random.choice(users).id,
                handler_id=random.choice(users[1:]).id if status != PlagiarismStatus.REPORTED else None,
                status=status,
                severity=random.choice(severities),
                assignment_name=assignments[i % len(assignments)][0],
                course_name=assignments[i % len(assignments)][1],
                similarity_score=round(random.uniform(30, 98), 1),
                original_author=f"学员{random.choice(names)}",
                description=f"在批改{assignments[i % len(assignments)][0]}时，发现与往届作业存在高度相似。经初步比对，相似度超过{random.randint(50, 90)}%，涉及多个关键部分。",
                evidence_urls=[
                    f"https://cdn.example.com/plagiarism/{i}/original.pdf",
                    f"https://cdn.example.com/plagiarism/{i}/suspect.pdf",
                    f"https://cdn.example.com/plagiarism/{i}/comparison.html",
                ],
                investigation_notes=random.choice([
                    "",
                    "经比对，确认核心代码段完全一致。",
                    "学员承认参考了他人作业。",
                    "相似度虽高，但结构为通用模板，暂不认定。",
                    "需要进一步与双方核实。",
                ]) if status not in [PlagiarismStatus.REPORTED] else None,
                resolution=random.choice([
                    "",
                    "本次警告，作业重做。",
                    "扣除本次作业分数，取消本次评优资格。",
                    "成绩记0分，记入学员诚信档案。",
                ]) if status in [PlagiarismStatus.CONFIRMED, PlagiarismStatus.RESOLVED] else None,
                punishment=random.choice([
                    "",
                    "口头警告+作业重做",
                    "书面警告+本次0分+通报批评",
                    "严重警告+取消结业资格",
                ]) if status in [PlagiarismStatus.CONFIRMED, PlagiarismStatus.RESOLVED] else None,
                appeal_deadline=date.today() + timedelta(days=7) if status in [PlagiarismStatus.CONFIRMED] else None,
                resolved_at=datetime.now() - timedelta(days=random.randint(1, 15)) if status == PlagiarismStatus.RESOLVED else None,
                created_at=datetime.now() - timedelta(days=random.randint(1, 45)),
            )
            db.add(p)

        db.commit()
        print("\n✅ 数据初始化完成！")
        print(f"   - 用户: {len(users)} 个")
        print(f"   - 会员档案: {len(members)} 个")
        print(f"   - 权益规则: {len(benefits)} 个")
        print(f"   - 社群单据: {len(tickets)} 个")
        print(f"   - 账户流水: {len(txns)} 条")
        print(f"   - 抄袭案例: 15 个")

    except Exception as e:
        db.rollback()
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
