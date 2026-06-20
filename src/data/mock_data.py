from __future__ import annotations

import uuid
import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

import numpy as np
import polars as pl

from src.data.database import db


class MockDataGenerator:
    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)

    def _id(self, prefix: str) -> str:
        return f"{prefix}_{uuid.uuid4().hex[:12]}"

    def generate_events(self, count: int = 3) -> pl.DataFrame:
        event_names = [
            "2026夏季音乐节盛典",
            "科技创新峰会2026",
            "国际美食文化节",
            "跨年演唱会2026",
            "动漫游戏展ChinaJoy",
        ]
        venues = [
            "国家体育场（鸟巢）",
            "上海世博中心",
            "广州白云国际会展中心",
            "深圳湾体育中心",
            "成都天府国际会议中心",
        ]
        organizers = ["星辰文化传媒", "智创未来科技", "环球会展集团", "乐动娱乐"]

        data = []
        base_date = datetime(2026, 7, 15)
        for i in range(count):
            event_id = self._id("EVT")
            event_date = base_date + timedelta(days=i * 7)
            data.append(
                {
                    "event_id": event_id,
                    "event_name": event_names[i % len(event_names)],
                    "event_date": event_date.date(),
                    "event_time": (datetime(2026, 7, 15, 19, 30) + timedelta(hours=i)).time(),
                    "venue": venues[i % len(venues)],
                    "organizer": organizers[i % len(organizers)],
                    "total_capacity": random.randint(5000, 50000),
                    "created_at": datetime.now(),
                }
            )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_sponsors(self, events_df: pl.DataFrame) -> pl.DataFrame:
        sponsor_pool = [
            ("SP_A", "中国移动", "王总", "138****1234", "钻石赞助商"),
            ("SP_B", "华为技术", "李经理", "139****5678", "钻石赞助商"),
            ("SP_C", "阿里巴巴", "张主管", "137****9012", "金牌赞助商"),
            ("SP_D", "腾讯科技", "刘总监", "136****3456", "金牌赞助商"),
            ("SP_E", "字节跳动", "陈经理", "135****7890", "银牌赞助商"),
            ("SP_F", "美团点评", "赵主管", "134****2345", "银牌赞助商"),
            ("SP_G", "京东集团", "孙总", "133****6789", "赞助商"),
            ("SP_H", "小米科技", "周经理", "132****0123", "赞助商"),
        ]

        data = []
        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            num_sponsors = random.randint(3, 6)
            selected = random.sample(sponsor_pool, num_sponsors)
            for prefix, name, contact, phone, level in selected:
                allocated = random.choice([50, 100, 200, 300, 500])
                data.append(
                    {
                        "sponsor_id": self._id("SPN"),
                        "sponsor_name": name,
                        "contact_person": contact,
                        "contact_phone": phone,
                        "sponsor_level": level,
                        "event_id": event_id,
                        "allocated_tickets": allocated,
                        "used_tickets": 0,
                        "created_at": datetime.now(),
                    }
                )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_ticket_types(self, events_df: pl.DataFrame, sponsors_df: pl.DataFrame) -> pl.DataFrame:
        type_templates = [
            ("VIP票", 2999.0, 200, 2),
            ("一等座", 1599.0, 800, 4),
            ("二等座", 899.0, 3000, 6),
            ("普通票", 399.0, 10000, 10),
            ("学生票", 199.0, 1000, 2),
            ("早鸟票", 299.0, 500, 4),
        ]

        data = []
        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            event_date = datetime.combine(event["event_date"], datetime.min.time())
            event_sponsors = sponsors_df.filter(pl.col("event_id") == event_id)

            for tpl in type_templates:
                type_name, price, qty, max_per = tpl
                tt_id = self._id("TT")

                use_sponsor = random.random() < 0.3 and event_sponsors.height > 0
                sponsor_id = None
                if use_sponsor:
                    sponsor_id = event_sponsors["sponsor_id"][random.randint(0, event_sponsors.height - 1)]

                rules = {
                    "requires_id": type_name == "VIP票",
                    "age_limit": None,
                    "transferable": type_name != "学生票",
                    "entry_gates": ["A", "B", "C"] if type_name == "VIP票" else ["B", "C"],
                }

                data.append(
                    {
                        "ticket_type_id": tt_id,
                        "event_id": event_id,
                        "type_name": type_name,
                        "price": price,
                        "total_quantity": qty,
                        "max_per_order": max_per,
                        "sale_start_time": event_date - timedelta(days=60),
                        "sale_end_time": event_date - timedelta(hours=2),
                        "sponsor_id": sponsor_id,
                        "validation_rules": json.dumps(rules, ensure_ascii=False),
                        "description": f"{event['event_name']} - {type_name}",
                        "created_at": datetime.now(),
                    }
                )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_tickets_and_orders(
        self,
        events_df: pl.DataFrame,
        ticket_types_df: pl.DataFrame,
        sponsors_df: pl.DataFrame,
    ) -> tuple[pl.DataFrame, pl.DataFrame]:
        first_names = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"]
        last_names = ["伟", "芳", "娜", "敏", "静", "磊", "强", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明"]
        sources = ["官网", "微信小程序", "支付宝", "大麦网", "猫眼", "线下售票处", "合作渠道"]
        channels = ["线上", "线上", "线上", "线上", "线下", "企业团购", "赠票"]

        orders_data: List[Dict[str, Any]] = []
        tickets_data: List[Dict[str, Any]] = []

        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            event_date = datetime.combine(event["event_date"], datetime.min.time())
            event_tt = ticket_types_df.filter(pl.col("event_id") == event_id)
            event_sponsors = sponsors_df.filter(pl.col("event_id") == event_id)

            target_tickets = int(event["total_capacity"] * random.uniform(0.75, 0.95))
            generated = 0

            while generated < target_tickets:
                order_id = self._id("ORD")
                num_tickets = random.randint(1, min(8, target_tickets - generated))

                tt_row = event_tt.row(random.randint(0, event_tt.height - 1), named=True)
                tt_id = tt_row["ticket_type_id"]
                base_price = float(tt_row["price"])

                buyer_first = random.choice(first_names)
                buyer_last = random.choice(last_names)
                buyer_name = buyer_first + buyer_last
                buyer_phone = f"1{random.choice(['3', '5', '7', '8', '9'])}{''.join([str(random.randint(0, 9)) for _ in range(9)])}"
                buyer_email = f"user{uuid.uuid4().hex[:6]}@example.com"

                source = random.choice(sources)
                channel = random.choice(channels)

                total_amount = 0.0
                final_amount = 0.0

                use_sponsor_ticket = channel == "企业团购" and event_sponsors.height > 0 and random.random() < 0.6
                order_sponsor_id = None
                if use_sponsor_ticket:
                    order_sponsor_id = event_sponsors["sponsor_id"][
                        random.randint(0, event_sponsors.height - 1)
                    ]

                ticket_status_options = ["active"] * 85 + ["refunded"] * 15
                payment_status_options = ["paid"] * 88 + ["unpaid"] * 8 + ["failed"] * 4

                for _ in range(num_tickets):
                    ticket_id = self._id("TKT")
                    ticket_code = f"T{event_id[-6:].upper()}{uuid.uuid4().hex[:8].upper()}"

                    attendee_name = buyer_name if random.random() < 0.7 else random.choice(first_names) + random.choice(last_names)

                    discount = 0.0
                    if random.random() < 0.25:
                        discount = round(base_price * random.uniform(0.05, 0.3), 2)
                    final_price = round(base_price - discount, 2)
                    total_amount += base_price
                    final_amount += final_price

                    ticket_status = random.choice(ticket_status_options)
                    payment_status = "paid" if ticket_status == "active" else random.choice(payment_status_options)
                    if ticket_status == "refunded":
                        payment_status = "paid"
                        refund_status = random.choice(["processing", "completed", "partial"])
                    else:
                        refund_status = "none"

                    purchase_time = event_date - timedelta(
                        days=random.randint(1, 60),
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59),
                    )

                    seat_info = None
                    if tt_row["type_name"] in ["VIP票", "一等座", "二等座"]:
                        zone = random.choice(["A区", "B区", "C区", "D区"])
                        row = random.randint(1, 20)
                        seat = random.randint(1, 30)
                        seat_info = f"{zone}{row}排{seat}座"

                    tickets_data.append(
                        {
                            "ticket_id": ticket_id,
                            "order_id": order_id,
                            "event_id": event_id,
                            "ticket_type_id": tt_id,
                            "sponsor_id": order_sponsor_id,
                            "ticket_code": ticket_code,
                            "buyer_name": buyer_name,
                            "buyer_phone": buyer_phone,
                            "buyer_email": buyer_email,
                            "attendee_name": attendee_name,
                            "seat_info": seat_info,
                            "original_price": base_price,
                            "discount_amount": discount,
                            "final_price": final_price,
                            "ticket_status": ticket_status,
                            "purchase_time": purchase_time,
                            "payment_status": payment_status,
                            "refund_status": refund_status,
                            "created_at": datetime.now(),
                        }
                    )

                orders_data.append(
                    {
                        "order_id": order_id,
                        "event_id": event_id,
                        "buyer_name": buyer_name,
                        "buyer_phone": buyer_phone,
                        "buyer_email": buyer_email,
                        "total_amount": round(total_amount, 2),
                        "discount_amount": round(total_amount - final_amount, 2),
                        "final_amount": round(final_amount, 2),
                        "ticket_count": num_tickets,
                        "order_status": "completed" if payment_status == "paid" else random.choice(["pending", "cancelled", "completed"]),
                        "order_source": source,
                        "sales_channel": channel,
                        "created_at": purchase_time,
                    }
                )

                generated += num_tickets

        return pl.DataFrame(orders_data, infer_schema_length=None), pl.DataFrame(tickets_data, infer_schema_length=None)

    def generate_payments(
        self, orders_df: pl.DataFrame, tickets_df: pl.DataFrame
    ) -> pl.DataFrame:
        methods = ["微信支付", "支付宝", "银联云闪付", "银行卡", "Apple Pay", "现金"]
        data = []

        for order in orders_df.iter_rows(named=True):
            if order["order_status"] == "cancelled":
                continue

            payment_id = self._id("PAY")
            order_id = order["order_id"]

            order_tickets = tickets_df.filter(pl.col("order_id") == order_id)
            if order_tickets.height == 0:
                continue

            refunded_count = order_tickets.filter(pl.col("ticket_status") == "refunded").height

            payment_method = random.choice(methods)
            payment_status = order["order_status"]
            transaction_id = None
            payment_time = None

            if payment_status == "completed":
                payment_status = "success"
                transaction_id = f"TXN{uuid.uuid4().hex[:16].upper()}"
                base_time = order["created_at"]
                payment_time = base_time + timedelta(minutes=random.randint(1, 30))

            refund_amount = 0.0
            refund_time = None
            refund_reason = None

            if refunded_count > 0:
                refund_amount = round(
                    float(order_tickets.filter(pl.col("ticket_status") == "refunded")["final_price"].sum()), 2
                )
                refund_time = payment_time + timedelta(days=random.randint(1, 15)) if payment_time else None
                refund_reason = random.choice(
                    ["行程变更", "无法参加", "重复购买", "购票错误", "不满意座位"]
                )

            gateway_response = {
                "gateway": payment_method,
                "merchant_id": f"MCH{random.randint(100000, 999999)}",
                "fee": round(float(order["final_amount"]) * 0.006, 2),
            }

            data.append(
                {
                    "payment_id": payment_id,
                    "order_id": order_id,
                    "event_id": order["event_id"],
                    "payment_method": payment_method,
                    "transaction_id": transaction_id,
                    "amount": float(order["final_amount"]),
                    "payment_status": payment_status,
                    "payment_time": payment_time,
                    "refund_amount": refund_amount,
                    "refund_time": refund_time,
                    "refund_reason": refund_reason,
                    "gateway_response": json.dumps(gateway_response, ensure_ascii=False),
                    "created_at": datetime.now(),
                }
            )

        return pl.DataFrame(data, infer_schema_length=None)

    def generate_staff(self, events_df: pl.DataFrame) -> pl.DataFrame:
        roles = ["检票员", "检票员", "检票员", "检票组长", "现场主管", "票务专员"]
        gates = ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "D1", "VIP通道1", "VIP通道2"]
        staff_names = [
            "李明", "王芳", "张伟", "刘洋", "陈静", "杨帆", "赵磊", "黄敏",
            "周强", "吴涛", "徐娜", "孙磊", "马超", "朱军", "胡洋", "郭艳",
        ]

        data = []
        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            num_staff = random.randint(10, 15)
            for i in range(num_staff):
                role = random.choice(roles)
                staff_name = random.choice(staff_names) + str(i)
                data.append(
                    {
                        "staff_id": self._id("STF"),
                        "staff_name": staff_name,
                        "staff_role": role,
                        "phone": f"1{random.choice(['3', '5', '8'])}{''.join([str(random.randint(0, 9)) for _ in range(9)])}",
                        "email": f"staff{uuid.uuid4().hex[:4]}@event.com",
                        "event_id": event_id,
                        "assigned_gate": random.choice(gates) if role in ["检票员", "检票组长"] else None,
                        "created_at": datetime.now(),
                    }
                )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_gate_records(
        self,
        events_df: pl.DataFrame,
        tickets_df: pl.DataFrame,
        staff_df: pl.DataFrame,
    ) -> pl.DataFrame:
        gate_info = {
            "A1": ("东广场入口", "GATE-A01"),
            "A2": ("东广场入口", "GATE-A02"),
            "B1": ("南广场入口", "GATE-B01"),
            "B2": ("南广场入口", "GATE-B02"),
            "B3": ("南广场入口", "GATE-B03"),
            "C1": ("西广场入口", "GATE-C01"),
            "C2": ("西广场入口", "GATE-C02"),
            "D1": ("北广场入口", "GATE-D01"),
            "VIP通道1": ("VIP专属入口", "GATE-VIP01"),
            "VIP通道2": ("VIP专属入口", "GATE-VIP02"),
        }

        data = []
        paid_tickets = tickets_df.filter(pl.col("payment_status") == "paid")

        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            event_date = datetime.combine(event["event_date"], datetime.min.time())
            event_start = datetime.combine(event["event_date"], event["event_time"] or datetime(2026, 7, 15, 19, 30).time())

            event_tickets = paid_tickets.filter(pl.col("event_id") == event_id)
            event_staff = staff_df.filter(pl.col("event_id") == event_id)

            if event_tickets.height == 0 or event_staff.height == 0:
                continue

            checkin_rate = random.uniform(0.65, 0.85)
            num_checkins = int(event_tickets.height * checkin_rate)

            sampled_indices = np.random.choice(event_tickets.height, num_checkins, replace=False)
            sampled_tickets = event_tickets[sampled_indices]

            for i, ticket in enumerate(sampled_tickets.iter_rows(named=True)):
                record_id = self._id("REC")

                time_offset_hours = np.random.normal(-0.75, 0.5)
                time_offset_hours = max(-3, min(1, time_offset_hours))
                check_in_time = event_start + timedelta(hours=time_offset_hours)

                gate_name = random.choice(list(gate_info.keys()))
                gate_id = gate_info[gate_name][1]

                matching_staff = event_staff.filter(
                    (pl.col("assigned_gate") == gate_name) | (pl.col("assigned_gate").is_null())
                )
                if matching_staff.height > 0:
                    staff_id = matching_staff["staff_id"][random.randint(0, matching_staff.height - 1)]
                else:
                    staff_id = event_staff["staff_id"][random.randint(0, event_staff.height - 1)]

                is_success = random.random() < 0.93
                check_status = "success" if is_success else random.choice(
                    ["duplicate", "invalid_code", "expired", "wrong_event", "blacklisted"]
                )
                fail_reason = None if is_success else {
                    "duplicate": "该票已被使用，重复检票",
                    "invalid_code": "无效票码，请核对",
                    "expired": "票券已过期",
                    "wrong_event": "非本场活动门票",
                    "blacklisted": "该票已被挂失/冻结",
                }[check_status]

                check_out_time = None
                if is_success and random.random() < 0.55:
                    duration_hours = random.uniform(1.5, 5.0)
                    check_out_time = check_in_time + timedelta(hours=duration_hours)

                device_info = {
                    "device_id": f"DEV-{gate_id[-3:]}-{random.randint(100, 999)}",
                    "device_type": random.choice(["闸机", "手持PDA", "扫码枪"]),
                    "firmware_version": f"v{random.randint(1, 4)}.{random.randint(0, 9)}.{random.randint(0, 99)}",
                    "battery_level": random.randint(35, 100),
                }

                raw_payload = {
                    "scan_id": f"SCAN{uuid.uuid4().hex[:12].upper()}",
                    "qr_version": random.choice(["v1", "v2", "v3"]),
                    "scan_latency_ms": random.randint(80, 350),
                    "network_type": random.choice(["5G", "WiFi", "4G"]),
                    "signal_strength": f"{random.randint(-80, -45)}dBm",
                }

                data.append(
                    {
                        "record_id": record_id,
                        "ticket_id": ticket["ticket_id"],
                        "event_id": event_id,
                        "ticket_code": ticket["ticket_code"],
                        "gate_id": gate_id,
                        "gate_name": gate_name,
                        "staff_id": staff_id,
                        "check_in_time": check_in_time,
                        "check_out_time": check_out_time,
                        "check_status": check_status,
                        "fail_reason": fail_reason,
                        "device_info": json.dumps(device_info, ensure_ascii=False),
                        "raw_payload": json.dumps(raw_payload, ensure_ascii=False),
                        "created_at": datetime.now(),
                    }
                )

        return pl.DataFrame(data, infer_schema_length=None)

    def generate_refund_disputes(
        self, tickets_df: pl.DataFrame, orders_df: pl.DataFrame
    ) -> pl.DataFrame:
        dispute_types = [
            "退票审核争议",
            "核销状态不符",
            "重复扣款",
            "票种差异",
            "入场受限",
            "座位不符",
        ]
        statuses = ["pending", "pending", "processing", "resolved", "rejected"]
        resolution_templates = {
            "resolved": "已全额退款至原支付账户，预计1-3个工作日到账。",
            "rejected": "根据购票协议，该票种不支持退票，已向用户解释说明。",
            "processing": "正在核实票务信息及支付流水，请稍候。",
        }

        data = []
        refunded_tickets = tickets_df.filter(pl.col("refund_status").is_in(["processing", "completed", "partial"]))

        num_disputes = max(5, int(refunded_tickets.height * 0.15))
        if refunded_tickets.height == 0:
            return pl.DataFrame([], infer_schema_length=None)

        indices = np.random.choice(refunded_tickets.height, min(num_disputes, refunded_tickets.height), replace=False)
        selected = refunded_tickets[indices]

        for ticket in selected.iter_rows(named=True):
            dispute_id = self._id("DSP")
            status = random.choice(statuses)
            dispute_type = random.choice(dispute_types)

            reasons_map = {
                "退票审核争议": "已提交退票申请超过7天仍未处理，要求尽快审核并退款。",
                "核销状态不符": "系统显示已核销但实际未入场，要求退票或补偿。",
                "重复扣款": "同一订单被扣款两次，查询账单后发现重复流水。",
                "票种差异": "购买的VIP票实际座位位置与描述不符，要求升级或退款。",
                "入场受限": "持票到达现场后被告知无法入场，无合理理由。",
                "座位不符": "系统分配的座位号与票面信息不一致，产生纠纷。",
            }

            filed_time = ticket["purchase_time"] + timedelta(days=random.randint(1, 30))
            deadline = filed_time + timedelta(days=3)

            resolution = None
            resolution_time = None
            conclusion = None
            if status == "resolved":
                resolution = resolution_templates["resolved"]
                resolution_time = filed_time + timedelta(hours=random.randint(2, 48))
                conclusion = f"【{dispute_type}】已妥善处理，用户满意度良好。建议优化退票审核SLA。"
            elif status == "rejected":
                resolution = resolution_templates["rejected"]
                resolution_time = filed_time + timedelta(hours=random.randint(2, 24))
                conclusion = f"【{dispute_type}】按政策拒绝，已完成沟通闭环。需加强购票协议前端提示。"

            data.append(
                {
                    "dispute_id": dispute_id,
                    "ticket_id": ticket["ticket_id"],
                    "order_id": ticket["order_id"],
                    "event_id": ticket["event_id"],
                    "dispute_type": dispute_type,
                    "dispute_reason": reasons_map[dispute_type],
                    "applicant_name": ticket["buyer_name"],
                    "applicant_contact": ticket["buyer_phone"],
                    "dispute_status": status,
                    "filed_time": filed_time,
                    "assigned_to": random.choice(["票务组-王专员", "客服组-李主管", "财务组-张经理"]),
                    "deadline": deadline,
                    "resolution": resolution,
                    "resolution_time": resolution_time,
                    "conclusion": conclusion,
                    "created_at": datetime.now(),
                }
            )

        return pl.DataFrame(data, infer_schema_length=None)

    def generate_notes_tasks(
        self, refund_disputes_df: pl.DataFrame, tickets_df: pl.DataFrame
    ) -> pl.DataFrame:
        task_templates = [
            ("verification", "核实票务核销记录", "高", "核查闸机原始记录与系统状态是否一致"),
            ("payment_check", "核对支付与退款流水", "高", "调取支付网关原始流水，核实金额与时间"),
            ("customer_contact", "联系用户了解详情", "中", "电话沟通用户，记录争议细节与诉求"),
            ("document", "整理争议材料归档", "低", "将所有相关证据整理归档，以备审计"),
            ("report", "生成争议处理报告", "中", "汇总事件处理经过与结论，提交主管审核"),
        ]

        data = []
        if refund_disputes_df.height == 0:
            return pl.DataFrame([], infer_schema_length=None)

        for dispute in refund_disputes_df.iter_rows(named=True):
            num_tasks = random.randint(2, 4)
            selected_tasks = random.sample(task_templates, num_tasks)

            for i, (task_type, content, priority, detail) in enumerate(selected_tasks):
                task_status = random.choice(["pending", "in_progress", "completed"])
                created_time = dispute["filed_time"] + timedelta(minutes=random.randint(5, 60) * (i + 1))

                completed_at = None
                if task_status == "completed":
                    completed_at = created_time + timedelta(hours=random.randint(1, 24))

                data.append(
                    {
                        "task_id": self._id("TSK"),
                        "dispute_id": dispute["dispute_id"],
                        "ticket_id": dispute["ticket_id"],
                        "event_id": dispute["event_id"],
                        "task_type": task_type,
                        "task_content": f"{content}：{detail}",
                        "priority": priority,
                        "assigned_to": random.choice(["票务组-王专员", "客服组-李主管", "财务组-张经理", "现场组-赵主管"]),
                        "task_status": task_status,
                        "due_date": dispute["deadline"],
                        "created_by": "系统自动生成",
                        "created_at": created_time,
                        "updated_at": completed_at or created_time,
                        "completed_at": completed_at,
                    }
                )

        return pl.DataFrame(data, infer_schema_length=None)

    def generate_processing_conclusions(self, events_df: pl.DataFrame) -> pl.DataFrame:
        conclusion_pools = {
            "funnel": [
                ("核销漏斗整体分析", "本次活动核销率约为预期值的92%，主要流失环节在支付到有效票之间（退票影响），建议优化退票政策或加强用户到场提醒。"),
                ("分时段入场分析", "开场前30分钟为入场高峰，峰值吞吐量达到瓶颈，建议下一场活动增加临时检票通道或引导错峰入场。"),
            ],
            "sponsor": [
                ("赞助商票券利用率", "钻石赞助商票券使用率偏低（约58%），建议在活动前3天发送VIP专属提醒短信，提升到场率。"),
            ],
            "efficiency": [
                ("检票效率优化建议", "B入口故障次数较多，经排查为设备网络稳定性问题，建议下批次设备采购优先考虑离线核验功能。"),
                ("人工检票点建议", "检票员熟练度差异导致通过率差异显著，建议活动前加强统一培训并配备经验丰富的组长轮巡。"),
            ],
            "refund": [
                ("退票争议处理总结", "本期争议主要集中在退票审核时长，建议将审核SLA从72小时缩短至24小时，并引入自动核验规则。"),
            ],
        }

        data = []
        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            for related_type, conclusions in conclusion_pools.items():
                for i, (title, content) in enumerate(conclusions):
                    data.append(
                        {
                            "conclusion_id": self._id("CNC"),
                            "event_id": event_id,
                            "related_type": related_type,
                            "related_id": None,
                            "conclusion_title": title,
                            "conclusion_content": content,
                            "chart_reference": related_type,
                            "conclusion_type": random.choice(["analysis", "recommendation", "summary"]),
                            "author": random.choice(["数据分析师-小王", "运营主管-老李", "现场经理-阿强"]),
                            "created_at": datetime.now(),
                            "updated_at": datetime.now(),
                        }
                    )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_share_links(self, events_df: pl.DataFrame) -> pl.DataFrame:
        scopes = ["overview", "sponsors", "ticket_types", "checkin_details"]
        roles = [
            ["attendee"],
            ["ticket_staff"],
            ["gate_staff"],
            ["organizer"],
            ["organizer", "ticket_staff"],
            ["ticket_staff", "gate_staff"],
        ]

        data = []
        for event in events_df.iter_rows(named=True):
            event_id = event["event_id"]
            num_links = random.randint(3, 6)
            for _ in range(num_links):
                data.append(
                    {
                        "link_id": self._id("LNK"),
                        "link_token": uuid.uuid4().hex,
                        "event_id": event_id,
                        "view_scope": random.choice(scopes),
                        "allowed_roles": json.dumps(random.choice(roles)),
                        "expires_at": datetime.now() + timedelta(days=random.randint(7, 30)),
                        "max_views": random.choice([10, 50, 100, None]),
                        "current_views": random.randint(0, 30),
                        "created_by": random.choice(["admin", "运营主管", "数据分析师"]),
                        "created_at": datetime.now(),
                    }
                )
        return pl.DataFrame(data, infer_schema_length=None)

    def generate_users(self, events_df: pl.DataFrame) -> pl.DataFrame:
        user_defs = [
            ("admin001", "超级管理员", "organizer", "Admin", "admin@event.com"),
            ("ticket_mgr", "票务-张经理", "ticket_staff", "张伟", "zhang@event.com"),
            ("ticket_wang", "票务-王专员", "ticket_staff", "王芳", "wang@event.com"),
            ("gate_lead", "检票组长-李", "gate_staff", "李明", "li@event.com"),
            ("gate_staff1", "检票员-小陈", "gate_staff", "陈静", "chen@event.com"),
            ("op_manager", "运营-刘总", "organizer", "刘洋", "liu@event.com"),
            ("finance01", "财务-赵会计", "ticket_staff", "赵磊", "zhao@event.com"),
        ]

        data = []
        event_ids = events_df["event_id"].to_list()

        for username, display_name, role, name, email in user_defs:
            access = event_ids if role in ["organizer", "ticket_staff"] else random.sample(event_ids, max(1, len(event_ids) // 2))
            data.append(
                {
                    "user_id": self._id("USR"),
                    "username": username,
                    "user_role": role,
                    "display_name": display_name,
                    "email": email,
                    "phone": f"1{random.choice(['3', '5', '8'])}{''.join([str(random.randint(0, 9)) for _ in range(9)])}",
                    "event_access": json.dumps(access),
                    "is_active": True,
                    "created_at": datetime.now(),
                }
            )

        for i in range(5):
            data.append(
                {
                    "user_id": self._id("USR"),
                    "username": f"viewer{i+1:03d}",
                    "user_role": "attendee",
                    "display_name": f"观众用户{i+1}",
                    "email": f"viewer{i+1}@example.com",
                    "phone": f"1{random.choice(['3', '5', '8'])}{''.join([str(random.randint(0, 9)) for _ in range(9)])}",
                    "event_access": json.dumps(random.sample(event_ids, 1)),
                    "is_active": True,
                    "created_at": datetime.now(),
                }
            )

        return pl.DataFrame(data, infer_schema_length=None)

    def generate_all(self, event_count: int = 2) -> Dict[str, pl.DataFrame]:
        events = self.generate_events(event_count)
        sponsors = self.generate_sponsors(events)
        ticket_types = self.generate_ticket_types(events, sponsors)
        orders, tickets = self.generate_tickets_and_orders(events, ticket_types, sponsors)
        payments = self.generate_payments(orders, tickets)
        staff = self.generate_staff(events)
        gate_records = self.generate_gate_records(events, tickets, staff)
        refund_disputes = self.generate_refund_disputes(tickets, orders)
        notes_tasks = self.generate_notes_tasks(refund_disputes, tickets)
        conclusions = self.generate_processing_conclusions(events)
        share_links = self.generate_share_links(events)
        users = self.generate_users(events)

        return {
            "events": events,
            "sponsors": sponsors,
            "ticket_types": ticket_types,
            "orders": orders,
            "tickets": tickets,
            "payments": payments,
            "staff": staff,
            "gate_records": gate_records,
            "refund_disputes": refund_disputes,
            "notes_tasks": notes_tasks,
            "processing_conclusions": conclusions,
            "share_links": share_links,
            "users": users,
        }

    def populate_database(self, event_count: int = 2, replace: bool = False) -> Dict[str, int]:
        tables_to_write = [
            "events", "sponsors", "ticket_types", "orders", "tickets",
            "payments", "staff", "gate_records", "refund_disputes",
            "notes_tasks", "processing_conclusions", "share_links", "users",
        ]

        if replace:
            for table in reversed(tables_to_write):
                try:
                    db.execute(f"DELETE FROM {table}")
                except Exception:
                    pass

        all_data = self.generate_all(event_count)
        counts = {}
        for name, df in all_data.items():
            if name in tables_to_write and df.height > 0:
                try:
                    db.write_df(df, name, if_exists="append")
                    counts[name] = df.height
                except Exception as e:
                    print(f"Failed to write {name}: {e}")
                    counts[name] = 0
            else:
                counts[name] = df.height if hasattr(df, "height") else 0
        return counts


data_generator = MockDataGenerator()
