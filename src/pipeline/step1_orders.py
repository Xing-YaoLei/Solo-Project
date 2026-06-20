import polars as pl
from datetime import date, datetime, timedelta
import uuid
import random

from src.pipeline.base_step import PipelineStep
from src.config import Config
from src.data.simulator import DataSimulator


class MiniProgramOrdersStep(PipelineStep):
    def __init__(self):
        super().__init__(
            step_id="step1_orders",
            step_name="小程序订单数据",
            description="从小程序侧拉取游客订单数据"
        )
        self.simulator = DataSimulator()

    def _fetch_data(self, start_date: date, end_date: date) -> pl.DataFrame:
        return self.simulator.generate_orders(start_date, end_date)

    def _save_to_duckdb(self, df: pl.DataFrame):
        self.db.conn.execute("""
            DELETE FROM mini_program_orders
            WHERE order_date BETWEEN (SELECT MIN(order_date) FROM df)
                               AND (SELECT MAX(order_date) FROM df)
        """)
        self.db.insert_dataframe(df, "mini_program_orders")
