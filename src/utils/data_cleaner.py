"""
数据清洗模块：基于 Polars 实现数据清洗、去重、口径匹配
"""
import io
import re
import logging
from typing import Optional, Dict, List, Tuple, Any
from datetime import datetime, timedelta

import polars as pl
import numpy as np

from src.config import config

logger = logging.getLogger(__name__)


class DataCleaner:
    """数据清洗管道：处理点评记录、库存表、收银流水等原始数据"""

    STORE_NAME_MAPPING: Dict[str, str] = {
        "旗舰店": "S001",
        "一店": "S001",
        "总店": "S001",
        "分店A": "S002",
        "二店": "S002",
        "分店B": "S003",
        "三店": "S003",
        "体验店": "S004",
    }

    PAYMENT_METHOD_MAPPING: Dict[str, str] = {
        "微信": "WECHAT",
        "微信支付": "WECHAT",
        "支付宝": "ALIPAY",
        "现金": "CASH",
        "银行卡": "CARD",
        "刷卡": "CARD",
        "会员卡": "MEMBER_CARD",
        "储值卡": "MEMBER_CARD",
    }

    TRANSACTION_TYPE_MAPPING: Dict[str, str] = {
        "充值": "RECHARGE",
        "储值": "RECHARGE",
        "消费": "CONSUMPTION",
        "项目消费": "CONSUMPTION",
        "产品消费": "PRODUCT",
        "退款": "REFUND",
        "退单": "REFUND",
    }

    @classmethod
    def load_dataframe(cls, file_bytes: bytes, file_name: str) -> pl.DataFrame:
        """根据文件扩展名加载数据为 Polars DataFrame"""
        ext = file_name.split(".")[-1].lower()
        try:
            if ext in ("csv", "txt"):
                return pl.read_csv(io.BytesIO(file_bytes), try_parse_dates=True)
            elif ext in ("xlsx", "xls"):
                return pl.read_excel(io.BytesIO(file_bytes))
            elif ext == "parquet":
                return pl.read_parquet(io.BytesIO(file_bytes))
            elif ext == "json":
                return pl.read_json(io.BytesIO(file_bytes))
            else:
                raise ValueError(f"不支持的文件格式: {ext}")
        except Exception as e:
            logger.error("加载文件失败 %s: %s", file_name, e)
            raise

    @classmethod
    def normalize_column_names(cls, df: pl.DataFrame) -> pl.DataFrame:
        """标准化列名：去空格、转小写、中文转英文映射"""
        column_mapping = {
            "点评ID": "review_id",
            "客户ID": "customer_id",
            "会员ID": "customer_id",
            "门店": "store_name",
            "门店名称": "store_name",
            "门店编码": "store_id",
            "订单号": "order_id",
            "订单编号": "order_id",
            "项目名称": "service_name",
            "服务项目": "service_name",
            "技师": "technician_name",
            "服务技师": "technician_name",
            "评分": "rating",
            "评价内容": "review_content",
            "点评内容": "review_content",
            "标签": "tags",
            "评价标签": "tags",
            "服务日期": "service_date",
            "消费日期": "service_date",
            "提交时间": "review_submit_date",
            "点评时间": "review_submit_date",
            "同步时间": "sync_date",
            "库存ID": "inventory_id",
            "耗材编码": "material_code",
            "耗材名称": "material_name",
            "品类": "category",
            "分类": "category",
            "单位": "unit",
            "库存数量": "stock_quantity",
            "单价": "unit_price",
            "供应商": "supplier_name",
            "供应商名称": "supplier_name",
            "进货日期": "purchase_date",
            "到期日期": "expiry_date",
            "有效期": "expiry_date",
            "流水ID": "transaction_id",
            "交易编号": "transaction_id",
            "交易类型": "transaction_type",
            "金额": "amount",
            "实收金额": "amount",
            "支付方式": "payment_method",
            "卡项类型": "recharge_card_type",
            "充值卡类型": "recharge_card_type",
            "卡项面值": "recharge_card_value",
            "充值金额": "recharge_card_value",
            "交易时间": "transaction_date",
            "消费时间": "transaction_date",
            "备注": "remark",
            "卡项ID": "course_id",
            "项目卡项": "course_name",
            "卡项名称": "course_name",
            "总次数": "total_sessions",
            "已用次数": "used_sessions",
            "剩余次数": "remaining_sessions",
            "购买日期": "purchase_date",
            "到期日": "expiry_date",
            "指定技师": "assigned_technician",
            "总金额": "total_amount",
            "耗材用量ID": "usage_id",
            "使用量": "usage_quantity",
            "实际用量": "usage_quantity",
            "标准用量": "standard_usage_quantity",
            "使用日期": "transaction_date",
            "使用时间": "transaction_date",
        }
        new_columns = []
        for col in df.columns:
            clean_col = col.strip()
            mapped = column_mapping.get(clean_col)
            if mapped:
                new_columns.append(mapped)
            else:
                new_col = re.sub(r"[\s\-]+", "_", clean_col.lower())
                new_columns.append(new_col)
        return df.rename({old: new for old, new in zip(df.columns, new_columns)})

    @classmethod
    def deduplicate_dataframe(cls, df: pl.DataFrame, subset: Optional[List[str]] = None,
                              keep: str = "last") -> Tuple[pl.DataFrame, int]:
        """数据去重，返回去重后的DataFrame和移除的行数"""
        original_count = df.height
        if subset is None:
            subset = [c for c in df.columns if c.endswith("_id")]
            if not subset:
                subset = df.columns[:3]
        if keep == "last":
            df_clean = df.unique(subset=subset, keep="last")
        else:
            df_clean = df.unique(subset=subset, keep="first")
        removed = original_count - df_clean.height
        if removed > 0:
            logger.info("去重完成，移除 %d 行 (基于 %s)", removed, subset)
        return df_clean, removed

    @classmethod
    def standardize_store_id(cls, df: pl.DataFrame) -> pl.DataFrame:
        """门店名称/编码口径统一"""
        if "store_id" not in df.columns:
            if "store_name" in df.columns:
                df = df.with_columns(
                    pl.col("store_name").cast(pl.Utf8).str.strip_chars()
                )
                mapping_expr = pl.col("store_name")
                for name, code in cls.STORE_NAME_MAPPING.items():
                    mapping_expr = pl.when(pl.col("store_name").str.contains(name)).then(pl.lit(code)).otherwise(mapping_expr)
                df = df.with_columns(
                    store_id=mapping_expr.alias("store_id")
                )
            else:
                df = df.with_columns(store_id=pl.lit("S001"))
        df = df.with_columns(
            pl.col("store_id").cast(pl.Utf8).str.strip_chars().str.to_uppercase()
        )
        return df

    @classmethod
    def parse_dates_safely(cls, df: pl.DataFrame, date_columns: Optional[List[str]] = None) -> pl.DataFrame:
        """安全解析日期列，多种格式尝试"""
        if date_columns is None:
            date_columns = [
                col for col in df.columns
                if any(keyword in col for keyword in ["date", "time", "_at"])
            ]

        for col in date_columns:
            if col not in df.columns:
                continue
            if df[col].dtype in (pl.Date, pl.Datetime):
                continue
            try:
                df = df.with_columns(
                    pl.col(col).cast(pl.Utf8).str.strip_chars().alias(col)
                )
                parsed = pl.col(col)
                formats = [
                    "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                    "%Y.%m.%d", "%Y%m%d",
                ]
                for fmt in formats:
                    parsed = pl.coalesce(
                        pl.col(col).str.strptime(pl.Datetime, format=fmt, strict=False),
                        parsed
                    )
                df = df.with_columns(parsed.alias(col))
            except Exception as e:
                logger.warning("解析日期列 %s 失败: %s", col, e)
        return df

    @classmethod
    def clean_numeric_columns(cls, df: pl.DataFrame, numeric_columns: Optional[List[str]] = None) -> pl.DataFrame:
        """清洗数值列：去除货币符号、千分位等"""
        if numeric_columns is None:
            numeric_columns = [
                col for col in df.columns
                if any(keyword in col for keyword in ["amount", "price", "quantity", "sessions", "rating", "value"])
            ]

        for col in numeric_columns:
            if col not in df.columns:
                continue
            if df[col].dtype.is_numeric():
                continue
            try:
                cleaned = (
                    pl.col(col).cast(pl.Utf8)
                    .str.replace_all(r"[¥￥$,，\s]", "")
                    .str.replace_all(r"[^0-9.\-]", "")
                )
                df = df.with_columns(
                    pl.when(cleaned == "").then(None).otherwise(cleaned)
                    .cast(pl.Float64)
                    .alias(col)
                )
            except Exception as e:
                logger.warning("清洗数值列 %s 失败: %s", col, e)
        return df

    @classmethod
    def standardize_ids(cls, df: pl.DataFrame, id_columns: Optional[List[str]] = None) -> pl.DataFrame:
        """标准化ID列：去除空格、统一字符串格式"""
        if id_columns is None:
            id_columns = [col for col in df.columns if col.endswith("_id")]

        for col in id_columns:
            if col not in df.columns:
                continue
            df = df.with_columns(
                pl.col(col).cast(pl.Utf8).str.strip_chars().alias(col)
            )
        return df

    @classmethod
    def standardize_payment_method(cls, df: pl.DataFrame) -> pl.DataFrame:
        """支付方式口径统一"""
        if "payment_method" not in df.columns:
            return df
        col = pl.col("payment_method").cast(pl.Utf8).str.strip_chars()
        for raw, std in cls.PAYMENT_METHOD_MAPPING.items():
            col = pl.when(pl.col("payment_method").cast(pl.Utf8).str.contains(raw)).then(pl.lit(std)).otherwise(col)
        return df.with_columns(payment_method=col)

    @classmethod
    def standardize_transaction_type(cls, df: pl.DataFrame) -> pl.DataFrame:
        """交易类型口径统一"""
        if "transaction_type" not in df.columns:
            return df
        col = pl.col("transaction_type").cast(pl.Utf8).str.strip_chars()
        for raw, std in cls.TRANSACTION_TYPE_MAPPING.items():
            col = pl.when(pl.col("transaction_type").cast(pl.Utf8).str.contains(raw)).then(pl.lit(std)).otherwise(col)
        return df.with_columns(transaction_type=col)

    @classmethod
    def fill_default_values(cls, df: pl.DataFrame, table_type: str) -> pl.DataFrame:
        """根据表类型填充默认值"""
        if table_type == "reviews":
            if "rating" in df.columns:
                df = df.with_columns(
                    pl.col("rating").fill_null(5).cast(pl.Int32).clip(1, 5)
                )
            if "is_delayed" not in df.columns:
                df = df.with_columns(is_delayed=pl.lit(False))
            if "delay_hours" not in df.columns:
                df = df.with_columns(delay_hours=pl.lit(0.0))
        elif table_type == "inventory":
            if "stock_quantity" in df.columns:
                df = df.with_columns(
                    pl.col("stock_quantity").fill_null(0)
                )
        elif table_type == "cashier_transactions":
            if "amount" in df.columns:
                df = df.with_columns(
                    pl.col("amount").fill_null(0.0)
                )
        elif table_type == "material_usage":
            if "is_abnormal" not in df.columns:
                df = df.with_columns(is_abnormal=pl.lit(False))
        return df

    @classmethod
    def clean_reviews(cls, raw_df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """清洗点评记录表"""
        stats = {"original_rows": raw_df.height, "removed_duplicates": 0, "cleaned_rows": 0}

        df = cls.normalize_column_names(raw_df)
        df = cls.standardize_ids(df)
        df, removed = cls.deduplicate_dataframe(df, subset=["review_id"])
        stats["removed_duplicates"] = removed
        df = cls.standardize_store_id(df)
        df = cls.parse_dates_safely(df)
        df = cls.clean_numeric_columns(df)
        df = cls.fill_default_values(df, "reviews")

        required_cols = ["review_id", "customer_id", "store_id", "rating"]
        available_cols = [c for c in required_cols if c in df.columns]
        if len(available_cols) < 3:
            missing = set(required_cols) - set(df.columns)
            logger.warning("点评记录缺少关键字段: %s", missing)
        df = df.drop_nulls(subset=available_cols)

        stats["cleaned_rows"] = df.height
        logger.info("点评记录清洗完成: %d -> %d 行", stats["original_rows"], stats["cleaned_rows"])
        return df, stats

    @classmethod
    def clean_inventory(cls, raw_df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """清洗库存表"""
        stats = {"original_rows": raw_df.height, "removed_duplicates": 0, "cleaned_rows": 0}

        df = cls.normalize_column_names(raw_df)
        df = cls.standardize_ids(df)
        df, removed = cls.deduplicate_dataframe(df, subset=["inventory_id"])
        stats["removed_duplicates"] = removed
        df = cls.standardize_store_id(df)
        df = cls.parse_dates_safely(df)
        df = cls.clean_numeric_columns(df)
        df = cls.fill_default_values(df, "inventory")

        required_cols = ["inventory_id", "material_code", "material_name", "store_id"]
        available_cols = [c for c in required_cols if c in df.columns]
        df = df.drop_nulls(subset=available_cols)

        stats["cleaned_rows"] = df.height
        logger.info("库存表清洗完成: %d -> %d 行", stats["original_rows"], stats["cleaned_rows"])
        return df, stats

    @classmethod
    def clean_cashier_transactions(cls, raw_df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """清洗收银流水表"""
        stats = {"original_rows": raw_df.height, "removed_duplicates": 0, "cleaned_rows": 0}

        df = cls.normalize_column_names(raw_df)
        df = cls.standardize_ids(df)
        df, removed = cls.deduplicate_dataframe(df, subset=["transaction_id"])
        stats["removed_duplicates"] = removed
        df = cls.standardize_store_id(df)
        df = cls.parse_dates_safely(df)
        df = cls.clean_numeric_columns(df)
        df = cls.standardize_payment_method(df)
        df = cls.standardize_transaction_type(df)
        df = cls.fill_default_values(df, "cashier_transactions")

        required_cols = ["transaction_id", "customer_id", "store_id", "amount", "transaction_date"]
        available_cols = [c for c in required_cols if c in df.columns]
        df = df.drop_nulls(subset=available_cols)

        stats["cleaned_rows"] = df.height
        logger.info("收银流水清洗完成: %d -> %d 行", stats["original_rows"], stats["cleaned_rows"])
        return df, stats

    @classmethod
    def clean_course_items(cls, raw_df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """清洗项目卡项表"""
        stats = {"original_rows": raw_df.height, "removed_duplicates": 0, "cleaned_rows": 0}

        df = cls.normalize_column_names(raw_df)
        df = cls.standardize_ids(df)
        df, removed = cls.deduplicate_dataframe(df, subset=["course_id"])
        stats["removed_duplicates"] = removed
        df = cls.standardize_store_id(df)
        df = cls.parse_dates_safely(df)
        df = cls.clean_numeric_columns(df)

        if "remaining_sessions" not in df.columns and "total_sessions" in df.columns and "used_sessions" in df.columns:
            df = df.with_columns(
                (pl.col("total_sessions") - pl.col("used_sessions")).alias("remaining_sessions")
            )

        required_cols = ["course_id", "customer_id", "store_id", "course_name", "total_sessions"]
        available_cols = [c for c in required_cols if c in df.columns]
        df = df.drop_nulls(subset=available_cols)

        stats["cleaned_rows"] = df.height
        logger.info("项目卡项清洗完成: %d -> %d 行", stats["original_rows"], stats["cleaned_rows"])
        return df, stats

    @classmethod
    def clean_material_usage(cls, raw_df: pl.DataFrame) -> Tuple[pl.DataFrame, Dict[str, Any]]:
        """清洗耗材使用记录表"""
        stats = {"original_rows": raw_df.height, "removed_duplicates": 0, "cleaned_rows": 0}

        df = cls.normalize_column_names(raw_df)
        df = cls.standardize_ids(df)
        df, removed = cls.deduplicate_dataframe(df, subset=["usage_id"])
        stats["removed_duplicates"] = removed
        df = cls.standardize_store_id(df)
        df = cls.parse_dates_safely(df)
        df = cls.clean_numeric_columns(df)
        df = cls.fill_default_values(df, "material_usage")

        if "standard_usage_quantity" not in df.columns:
            df = df.with_columns(standard_usage_quantity=pl.col("usage_quantity"))

        required_cols = ["usage_id", "material_code", "material_name", "usage_quantity"]
        available_cols = [c for c in required_cols if c in df.columns]
        df = df.drop_nulls(subset=available_cols)

        stats["cleaned_rows"] = df.height
        logger.info("耗材使用记录清洗完成: %d -> %d 行", stats["original_rows"], stats["cleaned_rows"])
        return df, stats
