import polars as pl
from datetime import date

from src.pipeline.base_step import PipelineStep
from src.data.simulator import DataSimulator


class MerchantTransactionsStep(PipelineStep):
    def __init__(self):
        super().__init__(
            step_id="step3_merchants",
            step_name="商户流水数据",
            description="从商户平台同步消费流水"
        )
        self.simulator = DataSimulator()

    def _fetch_data(self, start_date: date, end_date: date) -> pl.DataFrame:
        return self.simulator.generate_merchant_transactions(start_date, end_date)

    def _save_to_duckdb(self, df: pl.DataFrame):
        self.db.conn.execute("""
            DELETE FROM merchant_transactions
            WHERE txn_date BETWEEN (SELECT MIN(txn_date) FROM df)
                               AND (SELECT MAX(txn_date) FROM df)
        """)
        self.db.insert_dataframe(df, "merchant_transactions")
