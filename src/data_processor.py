import logging
from typing import Tuple, Dict, Any, Optional, List
from datetime import datetime, date, timedelta
from dataclasses import dataclass

import polars as pl
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ProcessResult:
    df: pl.DataFrame
    row_count: int
    anomalies: List[Dict[str, Any]]
    stats: Dict[str, Any]


class DataProcessor:
    def __init__(self, target_attendance_rate: float = 0.85):
        self.target_attendance_rate = target_attendance_rate

    def process_inventory(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing inventory data, {len(df)} rows")
        anomalies = []
        stats = {}

        df = self._normalize_columns(df)

        required_cols = ["product_code", "product_name", "category", "stock_quantity",
                         "unit_price", "store"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Inventory missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("product_code").cast(pl.Utf8).str.strip(),
            pl.col("product_name").cast(pl.Utf8).str.strip(),
            pl.col("category").cast(pl.Utf8).str.strip(),
            pl.col("store").cast(pl.Utf8).str.strip(),
            pl.col("stock_quantity").cast(pl.Int64),
            pl.col("unit_price").cast(pl.Float64),
            pl.col("cost_price").cast(pl.Float64).fill_null(0) if "cost_price" in df.columns else pl.lit(0).alias("cost_price"),
        ])

        if "expiry_date" in df.columns:
            df = df.with_columns(pl.col("expiry_date").str.to_date(strict=False))
        else:
            df = df.with_columns(pl.lit(None).cast(pl.Date).alias("expiry_date"))

        if "supplier" not in df.columns:
            df = df.with_columns(pl.lit("未知").alias("supplier"))

        if "is_consumable" not in df.columns:
            consumable_keywords = ["精华", "面膜", "精油", "膏", "霜", "水", "乳", "液", "胶", "棉", "纸", "膜", "套"]
            df = df.with_columns(
                pl.col("product_name").str.contains("|".join(consumable_keywords)).alias("is_consumable")
            )

        low_stock = df.filter(pl.col("stock_quantity") <= 5)
        for row in low_stock.iter_rows(named=True):
            anomalies.append({
                "type": "low_stock",
                "product_code": row["product_code"],
                "product_name": row["product_name"],
                "stock_quantity": row["stock_quantity"],
                "store": row["store"],
                "message": f"库存过低: {row['stock_quantity']} 件",
            })

        today = date.today()
        if "expiry_date" in df.columns:
            near_expiry = df.filter(
                (pl.col("expiry_date").is_not_null()) &
                (pl.col("expiry_date") <= today + timedelta(days=90)) &
                (pl.col("expiry_date") >= today)
            )
            for row in near_expiry.iter_rows(named=True):
                days_left = (row["expiry_date"] - today).days
                anomalies.append({
                    "type": "near_expiry",
                    "product_code": row["product_code"],
                    "product_name": row["product_name"],
                    "expiry_date": row["expiry_date"],
                    "days_left": days_left,
                    "store": row["store"],
                    "message": f"即将过期: 剩余 {days_left} 天",
                })

            expired = df.filter(
                (pl.col("expiry_date").is_not_null()) &
                (pl.col("expiry_date") < today)
            )
            for row in expired.iter_rows(named=True):
                days_expired = (today - row["expiry_date"]).days
                anomalies.append({
                    "type": "expired",
                    "product_code": row["product_code"],
                    "product_name": row["product_name"],
                    "expiry_date": row["expiry_date"],
                    "days_expired": days_expired,
                    "store": row["store"],
                    "message": f"已过期: {days_expired} 天",
                })

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        df = df.with_columns([
            pl.lit(False).alias("anomaly_flag"),
            pl.lit(None).cast(pl.Utf8).alias("anomaly_note"),
        ])

        stats = {
            "total_products": len(df),
            "total_value": (df["stock_quantity"] * df["unit_price"]).sum(),
            "categories": df["category"].n_unique(),
            "stores": df["store"].n_unique(),
            "low_stock_count": len(low_stock),
            "near_expiry_count": len(near_expiry) if 'near_expiry' in locals() else 0,
            "expired_count": len(expired) if 'expired' in locals() else 0,
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def process_reviews(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing reviews data, {len(df)} rows")
        anomalies = []

        df = self._normalize_columns(df)

        required_cols = ["customer_id", "rating", "review_date"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Reviews missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("customer_id").cast(pl.Utf8),
            pl.col("rating").cast(pl.Int64).clip(1, 5),
            pl.col("review_date").str.to_date(strict=False),
        ])

        if "customer_name" not in df.columns:
            df = df.with_columns(pl.lit("匿名用户").alias("customer_name"))

        if "review_tags" not in df.columns or df["review_tags"].is_null().all():
            df = df.with_columns(pl.lit(None).cast(pl.List(pl.Utf8)).alias("review_tags"))
        else:
            if df["review_tags"].dtype != pl.List(pl.Utf8):
                df = df.with_columns(
                    pl.col("review_tags").cast(pl.Utf8).str.split(",").alias("review_tags")
                )

        if "review_text" not in df.columns:
            df = df.with_columns(pl.lit("").alias("review_text"))

        if "technician" not in df.columns:
            df = df.with_columns(pl.lit("未分配").alias("technician"))

        if "service_item" not in df.columns:
            df = df.with_columns(pl.lit("未指定").alias("service_item"))

        if "store" not in df.columns:
            df = df.with_columns(pl.lit("总店").alias("store"))

        if "order_id" not in df.columns:
            df = df.with_columns(pl.concat_str([
                pl.lit("ORD"),
                pl.col("customer_id"),
                pl.col("review_date").dt.strftime("%Y%m%d")
            ], separator="-").alias("order_id"))

        df = df.with_columns(
            self._calculate_sentiment(pl.col("review_text"), pl.col("rating")).alias("sentiment_score")
        )

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        bad_reviews = df.filter(pl.col("rating") <= 2)
        for row in bad_reviews.iter_rows(named=True):
            anomalies.append({
                "type": "bad_review",
                "customer_id": row["customer_id"],
                "rating": row["rating"],
                "technician": row["technician"],
                "service_item": row["service_item"],
                "store": row["store"],
                "message": f"差评预警: {row['rating']}星",
            })

        stats = {
            "total_reviews": len(df),
            "avg_rating": df["rating"].mean(),
            "avg_sentiment": df["sentiment_score"].mean(),
            "good_reviews": len(df.filter(pl.col("rating") >= 4)),
            "neutral_reviews": len(df.filter(pl.col("rating") == 3)),
            "bad_reviews": len(bad_reviews),
            "unique_technicians": df["technician"].n_unique(),
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def process_appointments(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing appointments data, {len(df)} rows")
        anomalies = []

        df = self._normalize_columns(df)

        required_cols = ["customer_id", "appointment_date", "technician"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Appointments missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("customer_id").cast(pl.Utf8),
            pl.col("appointment_date").str.to_date(strict=False),
            pl.col("technician").cast(pl.Utf8),
        ])

        if "appointment_time" not in df.columns:
            df = df.with_columns(pl.lit("10:00:00").alias("appointment_time"))
        df = df.with_columns(pl.col("appointment_time").cast(pl.Utf8).str.to_time(strict=False))

        if "status" not in df.columns:
            df = df.with_columns(pl.lit("已完成").alias("status"))

        if "attended" not in df.columns:
            df = df.with_columns(
                pl.when(pl.col("status").is_in(["已完成", "已到店"]))
                .then(True)
                .otherwise(False)
                .alias("attended")
            )

        for col in ["customer_name", "phone", "service_item", "category", "store", "card_used"]:
            if col not in df.columns:
                default = "未指定" if col != "phone" else ""
                df = df.with_columns(pl.lit(default).alias(col))

        for col in ["actual_amount"]:
            if col not in df.columns:
                df = df.with_columns(pl.lit(0.0).alias(col))
        df = df.with_columns(pl.col("actual_amount").cast(pl.Float64))

        if "is_member" not in df.columns:
            df = df.with_columns(pl.lit(False).alias("is_member"))

        if "check_in_time" not in df.columns:
            df = df.with_columns(pl.lit(None).cast(pl.Datetime).alias("check_in_time"))
        else:
            df = df.with_columns(pl.col("check_in_time").str.to_datetime(strict=False))

        if "check_out_time" not in df.columns:
            df = df.with_columns(pl.lit(None).cast(pl.Datetime).alias("check_out_time"))
        else:
            df = df.with_columns(pl.col("check_out_time").str.to_datetime(strict=False))

        no_shows = df.filter(
            (pl.col("status") == "已预约") &
            (pl.col("appointment_date") < date.today()) &
            (pl.col("attended") == False)
        )
        for row in no_shows.iter_rows(named=True):
            anomalies.append({
                "type": "no_show",
                "customer_id": row["customer_id"],
                "customer_name": row["customer_name"],
                "appointment_date": row["appointment_date"],
                "technician": row["technician"],
                "store": row["store"],
                "message": "顾客未到店",
            })

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        stats = {
            "total_appointments": len(df),
            "attended_count": df["attended"].sum(),
            "attendance_rate": df["attended"].mean() if len(df) > 0 else 0,
            "total_revenue": df["actual_amount"].sum(),
            "no_show_count": len(no_shows),
            "member_count": df["is_member"].sum(),
            "unique_technicians": df["technician"].n_unique(),
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def process_recharge(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing recharge data, {len(df)} rows")
        anomalies = []

        df = self._normalize_columns(df)

        required_cols = ["customer_id", "recharge_date", "recharge_amount"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Recharge missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("customer_id").cast(pl.Utf8),
            pl.col("recharge_date").str.to_date(strict=False),
            pl.col("recharge_amount").cast(pl.Float64),
        ])

        if "gift_amount" not in df.columns:
            df = df.with_columns(
                pl.when(pl.col("recharge_amount") >= 10000)
                .then(pl.col("recharge_amount") * 0.2)
                .when(pl.col("recharge_amount") >= 5000)
                .then(pl.col("recharge_amount") * 0.15)
                .when(pl.col("recharge_amount") >= 2000)
                .then(pl.col("recharge_amount") * 0.1)
                .otherwise(0)
                .alias("gift_amount")
            )

        for col in ["customer_name", "phone", "payment_method", "store", "sales_staff", "card_type"]:
            if col not in df.columns:
                default = "未指定" if col != "phone" else ""
                df = df.with_columns(pl.lit(default).alias(col))

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        high_value = df.filter(pl.col("recharge_amount") >= 10000)
        for row in high_value.iter_rows(named=True):
            anomalies.append({
                "type": "high_value_recharge",
                "customer_id": row["customer_id"],
                "customer_name": row["customer_name"],
                "amount": row["recharge_amount"],
                "store": row["store"],
                "message": f"高价值充值: ¥{row['recharge_amount']:,.0f}",
            })

        stats = {
            "total_transactions": len(df),
            "total_recharge": df["recharge_amount"].sum(),
            "total_gift": df["gift_amount"].sum(),
            "avg_recharge": df["recharge_amount"].mean(),
            "unique_customers": df["customer_id"].n_unique(),
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def process_service_cards(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing service cards data, {len(df)} rows")
        anomalies = []

        df = self._normalize_columns(df)

        required_cols = ["card_code", "card_name", "customer_id", "total_sessions"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Service cards missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("card_code").cast(pl.Utf8),
            pl.col("card_name").cast(pl.Utf8),
            pl.col("customer_id").cast(pl.Utf8),
            pl.col("total_sessions").cast(pl.Int64),
        ])

        if "used_sessions" not in df.columns:
            df = df.with_columns(pl.lit(0).alias("used_sessions"))
        df = df.with_columns(pl.col("used_sessions").cast(pl.Int64))

        if "remaining_sessions" not in df.columns:
            df = df.with_columns(
                (pl.col("total_sessions") - pl.col("used_sessions")).alias("remaining_sessions")
            )

        if "purchase_date" not in df.columns:
            df = df.with_columns(pl.lit(date.today()).alias("purchase_date"))
        df = df.with_columns(pl.col("purchase_date").str.to_date(strict=False))

        if "expiry_date" not in df.columns:
            df = df.with_columns(
                (pl.col("purchase_date") + pl.duration(days=365)).alias("expiry_date")
            )
        df = df.with_columns(pl.col("expiry_date").str.to_date(strict=False))

        for col in ["category", "store"]:
            if col not in df.columns:
                df = df.with_columns(pl.lit("未指定").alias(col))

        for col in ["original_price", "sale_price"]:
            if col not in df.columns:
                df = df.with_columns(pl.lit(0.0).alias(col))
        df = df.with_columns([
            pl.col("original_price").cast(pl.Float64),
            pl.col("sale_price").cast(pl.Float64),
        ])

        if "customer_name" not in df.columns:
            df = df.with_columns(pl.lit("未命名").alias("customer_name"))

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        near_expiry = df.filter(
            (pl.col("expiry_date") <= date.today() + timedelta(days=30)) &
            (pl.col("remaining_sessions") > 0)
        )
        for row in near_expiry.iter_rows(named=True):
            days_left = (row["expiry_date"] - date.today()).days
            anomalies.append({
                "type": "card_near_expiry",
                "customer_id": row["customer_id"],
                "customer_name": row["customer_name"],
                "card_name": row["card_name"],
                "remaining_sessions": row["remaining_sessions"],
                "days_left": days_left,
                "store": row["store"],
                "message": f"卡项即将过期: 剩余 {row['remaining_sessions']} 次, {days_left} 天",
            })

        stats = {
            "total_cards": len(df),
            "total_sessions": df["total_sessions"].sum(),
            "used_sessions": df["used_sessions"].sum(),
            "remaining_sessions": df["remaining_sessions"].sum(),
            "total_revenue": df["sale_price"].sum(),
            "utilization_rate": df["used_sessions"].sum() / df["total_sessions"].sum() if df["total_sessions"].sum() > 0 else 0,
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def process_schedules(self, df: pl.DataFrame) -> ProcessResult:
        logger.info(f"Processing schedules data, {len(df)} rows")
        anomalies = []

        df = self._normalize_columns(df)

        required_cols = ["technician", "schedule_date"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Schedules missing required columns: {missing_cols}")

        df = df.with_columns([
            pl.col("technician").cast(pl.Utf8),
            pl.col("schedule_date").str.to_date(strict=False),
        ])

        if "shift_type" not in df.columns:
            df = df.with_columns(pl.lit("全天").alias("shift_type"))

        time_defaults = {"早班": ("09:00", "18:00"), "晚班": ("12:00", "21:00"), "全天": ("09:00", "21:00")}
        if "start_time" not in df.columns:
            df = df.with_columns(
                pl.col("shift_type").map_elements(
                    lambda x: time_defaults.get(x, ("09:00", "21:00"))[0],
                    return_dtype=pl.Utf8
                ).alias("start_time")
            )
        if "end_time" not in df.columns:
            df = df.with_columns(
                pl.col("shift_type").map_elements(
                    lambda x: time_defaults.get(x, ("09:00", "21:00"))[1],
                    return_dtype=pl.Utf8
                ).alias("end_time")
            )

        df = df.with_columns([
            pl.col("start_time").str.to_time(strict=False),
            pl.col("end_time").str.to_time(strict=False),
        ])

        if "store" not in df.columns:
            df = df.with_columns(pl.lit("总店").alias("store"))

        if "is_leave" not in df.columns:
            df = df.with_columns(pl.lit(False).alias("is_leave"))

        if "leave_reason" not in df.columns:
            df = df.with_columns(pl.lit("").alias("leave_reason"))

        if "id" not in df.columns:
            df = df.with_row_index("id", offset=1)

        leaves = df.filter(pl.col("is_leave") == True)
        for row in leaves.iter_rows(named=True):
            anomalies.append({
                "type": "technician_leave",
                "technician": row["technician"],
                "schedule_date": row["schedule_date"],
                "leave_reason": row["leave_reason"],
                "store": row["store"],
                "message": f"技师请假: {row['leave_reason'] or '未说明原因'}",
            })

        stats = {
            "total_schedules": len(df),
            "unique_technicians": df["technician"].n_unique(),
            "leave_count": len(leaves),
            "stores": df["store"].n_unique(),
        }

        return ProcessResult(df=df, row_count=len(df), anomalies=anomalies, stats=stats)

    def calculate_attendance_metrics(self, appointments_df: pl.DataFrame,
                                     batch_id: Optional[str] = None) -> pl.DataFrame:
        logger.info("Calculating attendance rate metrics")

        if appointments_df.is_empty():
            return pl.DataFrame()

        daily_metrics = appointments_df.group_by(
            ["appointment_date", "technician", "store"]
        ).agg([
            pl.len().alias("total_appointments"),
            pl.col("attended").sum().alias("attended_count"),
            (pl.col("attended").sum() / pl.len()).alias("attendance_rate"),
        ]).rename({"appointment_date": "metric_date"})

        daily_metrics = daily_metrics.sort(["technician", "metric_date"])

        daily_metrics = daily_metrics.with_columns([
            pl.col("attendance_rate").shift(365).over("technician").alias("yoy_rate"),
            pl.col("attendance_rate").shift(30).over("technician").alias("mom_rate"),
            pl.lit(self.target_attendance_rate).alias("target_rate"),
        ])

        daily_metrics = daily_metrics.with_row_index("id", offset=1)

        if batch_id:
            daily_metrics = daily_metrics.with_columns(pl.lit(batch_id).alias("batch_id"))

        return daily_metrics

    def _normalize_columns(self, df: pl.DataFrame) -> pl.DataFrame:
        column_mapping = {
            "商品编码": "product_code", "产品编码": "product_code", "sku": "product_code",
            "商品名称": "product_name", "产品名称": "product_name", "name": "product_name",
            "分类": "category", "类别": "category", "品类": "category",
            "库存数量": "stock_quantity", "库存": "stock_quantity", "quantity": "stock_quantity",
            "售价": "unit_price", "单价": "unit_price", "price": "unit_price",
            "成本价": "cost_price", "进价": "cost_price",
            "供应商": "supplier",
            "有效期": "expiry_date", "过期日期": "expiry_date",
            "门店": "store", "店铺": "store",
            "是否耗材": "is_consumable",
            "客户ID": "customer_id", "会员ID": "customer_id",
            "客户姓名": "customer_name", "会员姓名": "customer_name",
            "手机号": "phone", "电话": "phone",
            "评分": "rating", "星级": "rating",
            "评价标签": "review_tags", "标签": "review_tags",
            "评价内容": "review_text", "评价": "review_text",
            "评价日期": "review_date",
            "技师": "technician", "美容师": "technician",
            "服务项目": "service_item", "项目": "service_item",
            "订单号": "order_id",
            "预约日期": "appointment_date",
            "预约时间": "appointment_time",
            "预约状态": "status",
            "到店时间": "check_in_time",
            "离店时间": "check_out_time",
            "实际消费": "actual_amount", "消费金额": "actual_amount",
            "使用卡项": "card_used",
            "是否会员": "is_member",
            "是否到店": "attended",
            "充值日期": "recharge_date",
            "充值金额": "recharge_amount",
            "赠送金额": "gift_amount",
            "支付方式": "payment_method",
            "销售员工": "sales_staff",
            "卡类型": "card_type",
            "卡编码": "card_code", "卡号": "card_code",
            "卡名称": "card_name",
            "总次数": "total_sessions",
            "已用次数": "used_sessions",
            "剩余次数": "remaining_sessions",
            "原价": "original_price",
            "售价": "sale_price",
            "购买日期": "purchase_date",
            "排班日期": "schedule_date", "日期": "schedule_date",
            "班次": "shift_type",
            "开始时间": "start_time",
            "结束时间": "end_time",
            "是否请假": "is_leave",
            "请假原因": "leave_reason",
        }

        df = df.rename({
            col: column_mapping[col]
            for col in df.columns
            if col in column_mapping
        })

        df = df.rename({
            col.lower(): column_mapping[col.lower()]
            for col in df.columns
            if col.lower() in column_mapping and col not in column_mapping
        })

        return df

    def _calculate_sentiment(self, text: pl.Expr, rating: pl.Expr) -> pl.Expr:
        positive_words = ["好", "棒", "满意", "喜欢", "赞", "不错", "舒服", "专业", "细心", "推荐", "完美", "值得"]
        negative_words = ["差", "不好", "失望", "糟糕", "难受", "疼", "痛", "慢", "贵", "投诉", "后悔", "推销"]

        def get_sentiment(txt: str, rt: int) -> float:
            if not txt:
                base = (rt - 3) / 2
                return max(-1, min(1, base))

            pos_count = sum(1 for w in positive_words if w in txt)
            neg_count = sum(1 for w in negative_words if w in txt)

            if pos_count + neg_count == 0:
                text_score = 0
            else:
                text_score = (pos_count - neg_count) / (pos_count + neg_count)

            rating_score = (rt - 3) / 2
            final_score = 0.4 * text_score + 0.6 * rating_score
            return max(-1, min(1, final_score))

        return pl.map_groups(
            exprs=[text, rating],
            function=lambda df: pl.Series([get_sentiment(str(t), int(r)) for t, r in zip(df[0], df[1])]),
            return_dtype=pl.Float64,
        )
