import polars as pl
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import random

from config.settings import REGIONS, DOC_TYPES, RISK_WORDS, REVIEW_STATUS, INTERACTION_TYPES


def generate_case_docs(days: int = 90, count: int = 2000) -> pl.DataFrame:
    np.random.seed(42)
    random.seed(42)

    end_date = datetime(2026, 6, 20)
    start_date = end_date - timedelta(days=days)

    case_ids = [f"CASE{str(i).zfill(6)}" for i in range(1, count + 1)]
    dates = [start_date + timedelta(days=random.randint(0, days)) for _ in range(count)]
    regions = [random.choice(REGIONS) for _ in range(count)]
    doc_types = [random.choice(DOC_TYPES) for _ in range(count)]
    statuses = np.random.choice(
        REVIEW_STATUS, count, p=[0.1, 0.15, 0.35, 0.15, 0.25]
    )

    review_counts = np.random.randint(0, 5, count)
    return_counts = np.where(
        statuses == "已退回",
        np.random.randint(1, 4, count),
        np.random.randint(0, 2, count),
    )

    risk_word_counts = np.random.poisson(lam=2, size=count)
    risk_word_counts = np.where(
        statuses == "已退回",
        risk_word_counts + np.random.randint(2, 6, count),
        risk_word_counts,
    )

    risk_words = []
    for c in risk_word_counts:
        n = min(c, len(RISK_WORDS))
        risk_words.append(",".join(random.sample(RISK_WORDS, int(n))))

    lawyers = [f"律师{random.randint(1, 50)}" for _ in range(count)]
    clients = [f"客户{random.randint(1, 300)}" for _ in range(count)]

    df = pl.DataFrame({
        "case_id": case_ids,
        "doc_id": [f"DOC{str(i).zfill(8)}" for i in range(1, count + 1)],
        "submit_date": dates,
        "region": regions,
        "doc_type": doc_types,
        "status": statuses,
        "review_count": review_counts.tolist(),
        "return_count": return_counts.tolist(),
        "risk_word_count": risk_word_counts.tolist(),
        "risk_words": risk_words,
        "lawyer": lawyers,
        "client": clients,
        "doc_title": [f"{doc_types[i]}-{case_ids[i]}" for i in range(count)],
    })

    return df.sort("submit_date", descending=True)


def generate_review_records(case_docs: pl.DataFrame) -> pl.DataFrame:
    records = []
    review_id = 1

    for row in case_docs.iter_rows(named=True):
        num_reviews = row["review_count"]
        if num_reviews == 0:
            continue

        base_date = row["submit_date"]
        for i in range(num_reviews):
            review_date = base_date + timedelta(days=random.randint(1, 7) * (i + 1))

            is_return = i < row["return_count"]
            result = "已退回" if is_return else (
                row["status"] if row["status"] in ["已通过", "已发布"] else "审核中"
            )

            reviewer = f"审核员{random.randint(1, 15)}"

            comments_parts = []
            if is_return:
                num_risk = random.randint(2, 5)
                selected_risk = random.sample(RISK_WORDS, num_risk)
                comments_parts.extend([f"存在{w}问题" for w in selected_risk])
                comments_parts.append(random.choice([
                    "请补充相关材料",
                    "格式需要调整",
                    "内容不完整，请完善",
                    "法律依据不足",
                ]))
            else:
                comments_parts.append(random.choice([
                    "审核通过，符合要求",
                    "材料齐全，准予归档",
                    "内容完整，可以发布",
                ]))

            record = {
                "review_id": f"REV{str(review_id).zfill(8)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "review_date": review_date,
                "reviewer": reviewer,
                "result": result,
                "comments": "；".join(comments_parts),
                "review_round": i + 1,
                "is_return": is_return,
            }
            records.append(record)
            review_id += 1

    return pl.DataFrame(records).sort("review_date", descending=True)


def generate_interaction_logs(case_docs: pl.DataFrame, review_records: pl.DataFrame) -> pl.DataFrame:
    logs = []
    log_id = 1

    for row in case_docs.iter_rows(named=True):
        submit_time = row["submit_date"] + timedelta(
            hours=random.randint(8, 18), minutes=random.randint(0, 59)
        )
        logs.append({
            "log_id": f"LOG{str(log_id).zfill(10)}",
            "case_id": row["case_id"],
            "doc_id": row["doc_id"],
            "action": "提交",
            "operator": row["lawyer"],
            "action_time": submit_time,
            "detail": f"提交文书：{row['doc_title']}",
        })
        log_id += 1

        doc_reviews = review_records.filter(pl.col("doc_id") == row["doc_id"])
        for rev in doc_reviews.iter_rows(named=True):
            rev_time = rev["review_date"] + timedelta(
                hours=random.randint(9, 17), minutes=random.randint(0, 59)
            )
            logs.append({
                "log_id": f"LOG{str(log_id).zfill(10)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "action": "审核",
                "operator": rev["reviewer"],
                "action_time": rev_time,
                "detail": f"审核意见：{rev['comments'][:50]}",
            })
            log_id += 1

            if rev["is_return"]:
                return_time = rev_time + timedelta(hours=random.randint(2, 48))
                logs.append({
                    "log_id": f"LOG{str(log_id).zfill(10)}",
                    "case_id": row["case_id"],
                    "doc_id": row["doc_id"],
                    "action": "退回",
                    "operator": rev["reviewer"],
                    "action_time": return_time,
                    "detail": f"退回原因：{rev['comments'][:50]}",
                })
                log_id += 1

                modify_time = return_time + timedelta(hours=random.randint(1, 72))
                logs.append({
                    "log_id": f"LOG{str(log_id).zfill(10)}",
                    "case_id": row["case_id"],
                    "doc_id": row["doc_id"],
                    "action": "修改",
                    "operator": row["lawyer"],
                    "action_time": modify_time,
                    "detail": "根据审核意见修改后重新提交",
                })
                log_id += 1

        if row["status"] == "已发布":
            publish_time = submit_time + timedelta(days=random.randint(5, 15))
            logs.append({
                "log_id": f"LOG{str(log_id).zfill(10)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "action": "发布",
                "operator": f"管理员{random.randint(1, 5)}",
                "action_time": publish_time,
                "detail": "文书正式发布归档",
            })
            log_id += 1

        if row["status"] in ["已发布", "已通过"]:
            archive_time = submit_time + timedelta(days=random.randint(10, 30))
            logs.append({
                "log_id": f"LOG{str(log_id).zfill(10)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "action": "归档",
                "operator": f"档案员{random.randint(1, 8)}",
                "action_time": archive_time,
                "detail": "文书正式归档入库",
            })
            log_id += 1

    return pl.DataFrame(logs).sort("action_time", descending=True)


def generate_payment_flow(case_docs: pl.DataFrame) -> pl.DataFrame:
    payments = []
    pay_id = 1

    for row in case_docs.iter_rows(named=True):
        num_payments = random.randint(1, 3)
        for i in range(num_payments):
            pay_date = row["submit_date"] - timedelta(days=random.randint(1, 30))
            if pay_date < datetime(2026, 3, 1):
                pay_date = row["submit_date"]

            amount = random.randint(5000, 100000)
            if i > 0:
                amount = int(amount * random.uniform(0.3, 0.6))

            payments.append({
                "payment_id": f"PAY{str(pay_id).zfill(8)}",
                "case_id": row["case_id"],
                "client": row["client"],
                "payment_date": pay_date,
                "amount": amount,
                "payment_method": random.choice(["银行转账", "微信", "支付宝", "现金"]),
                "status": random.choice(["已到账", "已到账", "已到账", "待确认"]),
                "invoice_no": f"INV{str(pay_id).zfill(8)}" if random.random() > 0.2 else None,
            })
            pay_id += 1

    return pl.DataFrame(payments).sort("payment_date", descending=True)


def generate_calendar_events(case_docs: pl.DataFrame) -> pl.DataFrame:
    events = []
    event_id = 1

    for row in case_docs.iter_rows(named=True):
        if row["status"] == "已退回":
            deadline = row["submit_date"] + timedelta(days=random.randint(3, 14))
            events.append({
                "event_id": f"EVT{str(event_id).zfill(8)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "event_type": "补正截止",
                "event_date": deadline,
                "owner": row["lawyer"],
                "title": f"{row['doc_title']}-补正截止日",
                "status": random.choice(["待处理", "已完成", "已逾期"]),
            })
            event_id += 1

        if random.random() > 0.7:
            hearing_date = row["submit_date"] + timedelta(days=random.randint(15, 60))
            events.append({
                "event_id": f"EVT{str(event_id).zfill(8)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "event_type": "庭审排期",
                "event_date": hearing_date,
                "owner": row["lawyer"],
                "title": f"{row['case_id']}-庭审",
                "status": random.choice(["待开庭", "已完成"]),
            })
            event_id += 1

        if random.random() > 0.8:
            publish_date = row["submit_date"] + timedelta(days=random.randint(5, 20))
            events.append({
                "event_id": f"EVT{str(event_id).zfill(8)}",
                "case_id": row["case_id"],
                "doc_id": row["doc_id"],
                "event_type": "发布排期",
                "event_date": publish_date,
                "owner": f"管理员{random.randint(1, 5)}",
                "title": f"{row['doc_title']}-发布排期",
                "status": random.choice(["待发布", "已发布"]),
            })
            event_id += 1

    return pl.DataFrame(events).sort("event_date", descending=True)


def generate_all_data() -> Dict[str, pl.DataFrame]:
    case_docs = generate_case_docs()
    review_records = generate_review_records(case_docs)
    interaction_logs = generate_interaction_logs(case_docs, review_records)
    payment_flow = generate_payment_flow(case_docs)
    calendar_events = generate_calendar_events(case_docs)

    return {
        "case_docs": case_docs,
        "review_records": review_records,
        "interaction_logs": interaction_logs,
        "payment_flow": payment_flow,
        "calendar_events": calendar_events,
    }
