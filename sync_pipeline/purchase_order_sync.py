from typing import Optional
import polars as pl
from datetime import datetime

from .sync_pipeline import BaseSync
from data_layer import DataRepository
from config import DataSource


class PurchaseOrderSync(BaseSync):
    def __init__(self, repository: Optional[DataRepository] = None, mock_data: Optional[pl.DataFrame] = None):
        super().__init__(repository)
        self._mock_data = mock_data

    def data_source(self) -> str:
        return DataSource.PURCHASE_ORDER

    def extract(self) -> pl.DataFrame:
        if self._mock_data is not None:
            return self._mock_data

        from data_generator import generate_purchase_orders
        return generate_purchase_orders(n=70)

    def load(self, df: pl.DataFrame, batch_id: str):
        return self.repository.insert_purchase_orders(df, batch_id=batch_id)
