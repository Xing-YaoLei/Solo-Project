import polars as pl
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Dict
import random

random.seed(42)
np.random.seed(42)


def generate_date_range(start_date: str, end_date: str) -> list:
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def generate_case_system_data() -> pl.DataFrame:
    dates = generate_date_range("2025-01-01", "2026-06-20")
    case_types = ["民事起诉状", "答辩状", "代理词", "合同审查", "法律意见书", "律师函", "执行申请书", "仲裁申请书"]
    departments = ["民商一部", "民商二部", "知识产权部", "刑事部", "劳动人事部", "公司法律部"]
    lawyers = [f"律师{i:02d}" for i in range(1, 21)]
    status_list = ["已归档", "审核中", "已退回", "待提交", "已发布"]
    tags_pool = ["合同纠纷", "侵权责任", "劳动争议", "知识产权", "公司治理", "婚姻家庭", "房产纠纷", "金融借款"]

    records = []
    case_id = 10000

    for date in dates:
        daily_count = np.random.poisson(15)
        for _ in range(daily_count):
            case_id += 1
            case_type = random.choice(case_types)
            dept = random.choice(departments)
            lawyer = random.choice(lawyers)
            status = random.choices(status_list, weights=[0.6, 0.15, 0.1, 0.08, 0.07])[0]
            tags = random.sample(tags_pool, k=random.randint(1, 3))
            version = random.randint(1, 5)
            word_count = random.randint(2000, 15000)
            review_comments = ""
            if status == "已退回":
                review_comments = random.choice([
                    "事实陈述不清，请补充证据链",
                    "法律依据引用错误",
                    "格式不符合规范",
                    "当事人信息不全",
                    "诉讼请求不明确",
                ])

            records.append({
                "case_id": f"CASE{case_id}",
                "case_type": case_type,
                "department": dept,
                "lawyer": lawyer,
                "submit_date": date.strftime("%Y-%m-%d"),
                "status": status,
                "version": version,
                "tags": ",".join(tags),
                "word_count": word_count,
                "review_comments": review_comments,
                "source": "案件系统",
            })

    return pl.DataFrame(records)


def generate_email_attachment_data() -> pl.DataFrame:
    dates = generate_date_range("2025-01-01", "2026-06-20")
    doc_types = ["合同扫描件", "证据材料", "当事人身份证明", "授权委托书", "判决书", "调解书"]
    senders = [f"客户{i:02d}@client.com" for i in range(1, 31)]
    subjects = ["案件资料提交", "补充证据材料", "授权文件", "合同签署版", "判决书原件"]

    records = []
    email_id = 50000

    for date in dates:
        daily_count = np.random.poisson(8)
        for _ in range(daily_count):
            email_id += 1
            doc_type = random.choice(doc_types)
            sender = random.choice(senders)
            subject = random.choice(subjects)
            file_size = round(random.uniform(0.5, 20.0), 2)
            related_case = f"CASE{random.randint(10001, 10000 + int(len(dates) * 12))}"

            records.append({
                "email_id": f"EMAIL{email_id}",
                "doc_type": doc_type,
                "sender": sender,
                "subject": subject,
                "receive_date": date.strftime("%Y-%m-%d"),
                "file_size_mb": file_size,
                "related_case_id": related_case if random.random() > 0.3 else "",
                "archived": random.random() > 0.15,
                "source": "邮件附件",
            })

    return pl.DataFrame(records)


def generate_payment_flow_data() -> pl.DataFrame:
    dates = generate_date_range("2025-01-01", "2026-06-20")
    fee_types = ["律师费", "诉讼费", "保全费", "鉴定费", "公证费", "咨询费"]
    payment_methods = ["银行转账", "微信支付", "支付宝", "现金", "支票"]

    records = []
    payment_id = 80000

    for date in dates:
        daily_count = np.random.poisson(10)
        for _ in range(daily_count):
            payment_id += 1
            fee_type = random.choice(fee_types)
            method = random.choice(payment_methods)
            amount = round(random.uniform(500, 50000), 2)
            related_case = f"CASE{random.randint(10001, 10000 + int(len(dates) * 12))}"
            is_matched = random.random() > 0.2

            records.append({
                "payment_id": f"PAY{payment_id}",
                "fee_type": fee_type,
                "payment_method": method,
                "amount": amount,
                "payment_date": date.strftime("%Y-%m-%d"),
                "related_case_id": related_case if is_matched else "",
                "is_case_matched": is_matched,
                "source": "收款流水",
            })

    return pl.DataFrame(records)


def generate_schedule_data(case_data: pl.DataFrame) -> pl.DataFrame:
    dates = generate_date_range("2025-01-01", "2026-06-20")
    content_types = ["新法解读", "案例分析", "实务指南", "风险提示", "客户通讯"]

    case_type_to_content = {
        "民事起诉状": "案例分析",
        "答辩状": "实务指南",
        "代理词": "新法解读",
        "合同审查": "风险提示",
        "法律意见书": "客户通讯",
        "律师函": "风险提示",
        "执行申请书": "实务指南",
        "仲裁申请书": "案例分析",
    }

    case_rows = case_data.sort("submit_date").iter_rows(named=True)
    case_list = list(case_rows)
    case_idx = 0

    records = []
    schedule_id = 1

    for date in dates:
        if date.weekday() < 5:
            weekly_count = np.random.poisson(2)
            for _ in range(weekly_count):
                schedule_id += 1
                content_type = random.choice(content_types)

                related_case = ""
                if case_idx < len(case_list):
                    case = case_list[case_idx]
                    case_date = datetime.strptime(case["submit_date"], "%Y-%m-%d")
                    if case_date <= date:
                        if (
                            case_type_to_content.get(case["case_type"]) == content_type
                            or random.random() > 0.4
                        ):
                            related_case = case["case_id"]
                            case_idx += 1

                views = random.randint(50, 2000)
                conversions = int(views * random.uniform(0.02, 0.15))
                is_abnormal = random.random() < 0.08
                abnormal_reason = ""
                if is_abnormal:
                    abnormal_reason = random.choice([
                        "节假日流量波动",
                        "热点事件带动",
                        "推送渠道变更",
                        "内容排期调整",
                        "服务器维护影响",
                    ])

                records.append({
                    "schedule_id": f"SCH{schedule_id:05d}",
                    "publish_date": date.strftime("%Y-%m-%d"),
                    "content_type": content_type,
                    "title": f"{content_type}文章{schedule_id}",
                    "views": views,
                    "conversions": conversions,
                    "conversion_rate": round(conversions / views * 100, 2),
                    "is_abnormal": is_abnormal,
                    "abnormal_reason": abnormal_reason,
                    "target_rate": round(random.uniform(8, 12), 2),
                    "related_case_id": related_case,
                })

    return pl.DataFrame(records)


def generate_version_history(case_data: pl.DataFrame) -> pl.DataFrame:
    version_records = []
    for row in case_data.iter_rows(named=True):
        base_version = row["version"]
        for v in range(1, base_version + 1):
            is_last = v == base_version
            change_summary = (
                "初始版本" if v == 1
                else random.choice([
                    "补充事实陈述",
                    "调整法律依据",
                    "修正格式问题",
                    "更新证据清单",
                    "完善诉讼请求",
                ])
            )

            if is_last:
                status_map = {
                    "已归档": "通过",
                    "已发布": "通过",
                    "已退回": "退回修改",
                    "审核中": "待审核",
                    "待提交": "待审核",
                }
                review_status = status_map.get(row["status"], "待审核")
            else:
                review_status = random.choice(["通过", "退回修改"])

            word_delta = random.randint(-500, 2000) if v > 1 else 0

            version_records.append({
                "case_id": row["case_id"],
                "case_type": row["case_type"],
                "department": row["department"],
                "lawyer": row["lawyer"],
                "version": v,
                "is_latest": is_last,
                "version_date": (
                    datetime.strptime(row["submit_date"], "%Y-%m-%d")
                    - timedelta(days=(base_version - v) * random.randint(1, 3))
                ).strftime("%Y-%m-%d"),
                "change_summary": change_summary,
                "word_count_delta": word_delta,
                "review_status": review_status,
            })

    return pl.DataFrame(version_records)


def generate_all_data() -> Dict[str, pl.DataFrame]:
    case_system = generate_case_system_data()
    return {
        "case_system": case_system,
        "email_attachments": generate_email_attachment_data(),
        "payment_flow": generate_payment_flow_data(),
        "publish_schedule": generate_schedule_data(case_system),
        "version_history": generate_version_history(case_system),
    }
