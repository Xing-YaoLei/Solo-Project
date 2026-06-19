import uuid
import random
from datetime import datetime, timedelta
from database import db
from config import settings

class TestDataGenerator:
    def __init__(self):
        self.conn = db.get_conn()
        random.seed(42)

    def generate_all(self):
        self._generate_packages()
        self._generate_funnel_records()
        self._generate_payment_records()
        self._generate_door_lock_records()
        self._generate_verification_records()
        self._generate_customer_service_messages()
        self._generate_deposit_records()
        self._generate_channel_orders()
        print("测试数据生成完成！")

    def _generate_packages(self):
        packages = [
            ("PKG001", "海景豪华双人套餐", 888.00, 100, 23),
            ("PKG002", "山景温馨家庭套餐", 1288.00, 80, 45),
            ("PKG003", "蜜月浪漫套房套餐", 1888.00, 50, 8),
            ("PKG004", "周末休闲单人套餐", 499.00, 150, 67),
            ("PKG005", "团建聚会大套房套餐", 2999.00, 30, 35),
        ]
        
        for pkg in packages:
            try:
                self.conn.execute("""
                    INSERT INTO packages (package_id, package_name, price, original_stock, current_stock)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT DO NOTHING
                """, pkg)
            except Exception as e:
                pass

    def _random_date(self, start_days_ago=60, end_days_ago=0):
        start = datetime.now() - timedelta(days=start_days_ago)
        end = datetime.now() - timedelta(days=end_days_ago)
        delta = end - start
        random_days = random.uniform(0, delta.days)
        return start + timedelta(days=random_days)

    def _generate_funnel_records(self):
        stages = settings.FUNNEL_STAGES
        channels = ["官网", "微信小程序", "美团", "携程", "飞猪", "抖音"]
        
        existing = self.conn.execute("SELECT COUNT(*) FROM funnel_records").fetchone()[0]
        if existing > 0:
            return

        packages = self.conn.execute("SELECT package_id FROM packages").fetchall()
        package_ids = [row[0] for row in packages]

        records = []
        base_time = datetime.now() - timedelta(days=60)

        for i in range(5000):
            user_id = f"USER_{str(uuid.uuid4())[:8]}"
            package_id = random.choice(package_ids)
            channel = random.choice(channels)

            start_idx = 0
            if random.random() < 0.7:
                start_idx = 1
            if random.random() < 0.55:
                start_idx = 2
            if random.random() < 0.45:
                start_idx = 3
            if random.random() < 0.35:
                start_idx = 4
            if random.random() < 0.25:
                start_idx = 5

            stage_time = base_time + timedelta(
                days=random.randint(0, 60),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            for stage_idx in range(start_idx + 1):
                stage_time_inc = stage_time + timedelta(minutes=stage_idx * random.randint(1, 120))
                records.append((
                    f"FR_{uuid.uuid4().hex[:12]}",
                    user_id,
                    package_id,
                    stages[stage_idx],
                    stage_time_inc,
                    channel,
                    False,
                    1
                ))

        self.conn.executemany("""
            INSERT INTO funnel_records (record_id, user_id, package_id, stage, stage_time, channel, is_deleted, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_payment_records(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM payment_records").fetchone()[0]
        if existing > 0:
            return

        paid_orders = self.conn.execute("""
            SELECT DISTINCT user_id, package_id, stage_time 
            FROM funnel_records 
            WHERE stage = '完成支付'
            LIMIT 1500
        """).fetchall()

        payment_methods = ["微信支付", "支付宝", "银行卡", "云闪付"]
        channels = ["官网", "微信小程序", "美团", "携程", "飞猪", "抖音"]
        statuses = ["成功", "成功", "成功", "成功", "成功", "失败", "退款中"]

        records = []
        for i, row in enumerate(paid_orders):
            user_id, package_id, pay_time = row
            pkg = self.conn.execute("SELECT price FROM packages WHERE package_id = ?", [package_id]).fetchone()
            price = float(pkg[0]) if pkg else 0
            deposit = round(price * 0.2, 2)

            records.append((
                f"PAY_{uuid.uuid4().hex[:12]}",
                f"ORD_{uuid.uuid4().hex[:10]}",
                user_id,
                package_id,
                price,
                random.choice(payment_methods),
                pay_time + timedelta(minutes=random.randint(1, 30)),
                random.choice(statuses),
                random.choice(channels),
                deposit,
                1,
                datetime.now()
            ))

        self.conn.executemany("""
            INSERT INTO payment_records (payment_id, order_id, user_id, package_id, amount, payment_method, 
                                         payment_time, status, channel, deposit_amount, version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_door_lock_records(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM door_lock_records").fetchone()[0]
        if existing > 0:
            return

        bookings = self.conn.execute("""
            SELECT DISTINCT pr.order_id, pr.user_id, pr.package_id, pr.payment_time
            FROM payment_records pr
            WHERE pr.status = '成功'
            LIMIT 800
        """).fetchall()

        records = []
        for booking in bookings:
            order_id, user_id, package_id, pay_time = booking
            checkin = pay_time + timedelta(days=random.randint(1, 15), hours=random.randint(12, 16))
            checkout = checkin + timedelta(days=random.randint(1, 4), hours=random.randint(8, 12))
            status = "已入住"
            if checkout < datetime.now():
                status = "已退房"

            records.append((
                f"LOCK_{uuid.uuid4().hex[:12]}",
                order_id,
                user_id,
                package_id,
                checkin,
                checkout,
                random.randint(2, 30),
                checkin + timedelta(minutes=random.randint(5, 120)),
                status,
                1,
                datetime.now()
            ))

        self.conn.executemany("""
            INSERT INTO door_lock_records (lock_id, order_id, user_id, package_id, checkin_time, checkout_time,
                                           door_open_count, last_open_time, status, version, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_verification_records(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM verification_records").fetchone()[0]
        if existing > 0:
            return

        verifications = self.conn.execute("""
            SELECT DISTINCT fr.user_id, fr.package_id, dlr.order_id, dlr.checkout_time
            FROM funnel_records fr
            LEFT JOIN door_lock_records dlr ON fr.user_id = dlr.user_id AND fr.package_id = dlr.package_id
            WHERE fr.stage = '完成核销' AND dlr.status = '已退房'
            LIMIT 600
        """).fetchall()

        verify_types = ["前台核销", "扫码核销", "人脸识别", "电话预约核销"]
        operators = ["张前台", "李经理", "王接待", "系统自动"]

        records = []
        for row in verifications:
            user_id, package_id, order_id, checkout_time = row
            if order_id is None:
                order_id = f"ORD_{uuid.uuid4().hex[:10]}"

            records.append((
                f"VER_{uuid.uuid4().hex[:12]}",
                order_id,
                user_id,
                package_id,
                checkout_time if checkout_time else self._random_date(30, 0),
                random.choice(verify_types),
                random.choice(operators),
                "正常核销完成" if random.random() > 0.1 else "客户提前退房，已确认"
            ))

        self.conn.executemany("""
            INSERT INTO verification_records (verification_id, order_id, user_id, package_id, 
                                              verification_time, verification_type, operator, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_customer_service_messages(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM customer_service_messages").fetchone()[0]
        if existing > 0:
            return

        orders = self.conn.execute("""
            SELECT order_id, user_id, package_id, payment_time 
            FROM payment_records 
            WHERE status = '成功'
            LIMIT 500
        """).fetchall()

        message_templates_customer = [
            "请问这个套餐包含早餐吗？",
            "可以帮我安排高楼层的房间吗？",
            "我想修改一下入住日期可以吗？",
            "退房后押金什么时候退？",
            "有接送服务吗？",
            "请问附近有什么景点推荐？",
        ]

        refund_policies = ["入住前7天可免费取消", "入住前3天可免费取消", "不可取消", "扣20%手续费可取消"]
        sender_types = ["客户", "客服"]

        records = []
        for order in orders:
            order_id, user_id, package_id, pay_time = order
            msg_count = random.randint(1, 6)
            msg_time = pay_time - timedelta(days=random.randint(0, 10))

            for i in range(msg_count):
                sender = sender_types[i % 2]
                content = random.choice(message_templates_customer)
                promised_time = None
                promised_refund = None

                if sender == "客服":
                    content = f"尊敬的客户，您好！关于您的问题，{random.choice(['我们的套餐包含两份早餐', '可以帮您备注高楼层要求', '入住日期变更需要提前3天申请', '押金将在退房后24小时内原路退回', '我们提供免费接送机服务，请提前预约'])}"
                    if random.random() < 0.3:
                        promised_refund = random.choice(refund_policies)
                    if random.random() < 0.2:
                        promised_time = pay_time + timedelta(days=random.randint(3, 20))

                records.append((
                    f"MSG_{uuid.uuid4().hex[:12]}",
                    order_id,
                    user_id,
                    package_id,
                    content,
                    msg_time + timedelta(minutes=i * random.randint(3, 30)),
                    sender,
                    promised_time,
                    promised_refund,
                    1
                ))

        inconsistent_order = random.sample(range(len(orders)), min(20, len(orders)))
        for idx in inconsistent_order:
            if idx < len(orders):
                order_id, user_id, package_id, pay_time = orders[idx]
                for i in range(2):
                    records.append((
                        f"MSG_{uuid.uuid4().hex[:12]}",
                        order_id,
                        user_id,
                        package_id,
                        f"客服答复：关于您的退款政策，{refund_policies[i % len(refund_policies)]}",
                        pay_time + timedelta(hours=i * 2),
                        "客服",
                        pay_time + timedelta(days=random.randint(5 + i * 3, 10 + i * 5)) if i < 2 else None,
                        refund_policies[i % len(refund_policies)],
                        1
                    ))

        self.conn.executemany("""
            INSERT INTO customer_service_messages (message_id, order_id, user_id, package_id, message_content,
                                                    message_time, sender_type, promised_delivery_time, 
                                                    promised_refund_policy, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_deposit_records(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM deposit_records").fetchone()[0]
        if existing > 0:
            return

        payments = self.conn.execute("""
            SELECT order_id, user_id, package_id, deposit_amount, payment_time, status
            FROM payment_records
            LIMIT 1200
        """).fetchall()

        records = []
        for pay in payments:
            order_id, user_id, package_id, deposit, pay_time, pay_status = pay
            deposit_amount = float(deposit) if deposit else 0

            status = "已支付"
            refund_time = None
            refund_amount = None
            reason = None

            if pay_status == "成功":
                if random.random() < 0.5:
                    status = "已退款"
                    refund_time = pay_time + timedelta(days=random.randint(2, 20), hours=random.randint(1, 24))
                    refund_amount = deposit_amount
                    reason = "正常退房，无损坏，押金全额退还"
                elif random.random() < 0.6:
                    status = "部分退款"
                    refund_time = pay_time + timedelta(days=random.randint(2, 20))
                    refund_amount = round(deposit_amount * random.uniform(0.5, 0.9), 2)
                    reason = "房间有轻微污渍，扣除部分清洁费"

            records.append((
                f"DEP_{uuid.uuid4().hex[:12]}",
                order_id,
                user_id,
                package_id,
                deposit_amount,
                pay_time + timedelta(minutes=5),
                refund_time,
                refund_amount,
                status,
                reason
            ))

        self.conn.executemany("""
            INSERT INTO deposit_records (deposit_id, order_id, user_id, package_id, deposit_amount, 
                                         paid_time, refund_time, refund_amount, status, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    def _generate_channel_orders(self):
        existing = self.conn.execute("SELECT COUNT(*) FROM channel_orders").fetchone()[0]
        if existing > 0:
            return

        channels = ["美团", "携程", "飞猪", "去哪儿", "同程", "抖音"]
        abnormal_reasons = [
            "渠道价格与官网不一致",
            "订单状态同步延迟",
            "库存信息不一致导致超卖",
            "渠道佣金计算异常",
            "订单金额与支付金额不符",
            "用户信息缺失"
        ]

        payments = self.conn.execute("""
            SELECT order_id, package_id, amount, payment_time, channel, status
            FROM payment_records
            LIMIT 1400
        """).fetchall()

        records = []
        for pay in payments:
            internal_order_id, package_id, amount, pay_time, channel, status = pay
            channel_name = channel if channel in channels else random.choice(channels)

            is_abnormal = random.random() < 0.15
            abn_reason = None
            if is_abnormal:
                abn_reason = random.choice(abnormal_reasons)

            records.append((
                f"CH_{uuid.uuid4().hex[:12]}",
                internal_order_id if random.random() > 0.2 else None,
                package_id,
                channel_name,
                f"{channel_name.upper()}_{uuid.uuid4().hex[:15]}",
                float(amount) * random.uniform(0.95, 1.08),
                pay_time - timedelta(minutes=random.randint(1, 60)),
                status,
                is_abnormal,
                abn_reason
            ))

        self.conn.executemany("""
            INSERT INTO channel_orders (channel_order_id, internal_order_id, package_id, channel_name,
                                        channel_order_no, order_amount, create_time, status, 
                                        is_abnormal, abnormal_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

data_gen = TestDataGenerator()
