from typing import Optional
import polars as pl
from datetime import datetime

from .sync_pipeline import BaseSync
from data_layer import DataRepository
from config import DataSource


class PaymentRecordSync(BaseSync):
    def __init__(self, repository: Optional[DataRepository] = None, mock_data: Optional[pl.DataFrame] = None):
        super().__init__(repository)
        self._mock_data = mock_data

    def data_source(self) -> str:
        return DataSource.PAYMENT_RECORD

    def extract(self) -> pl.DataFrame:
        if self._mock_data is not None:
            return self._mock_data

        from data_generator import generate_payment_records
        return generate_payment_records(n=60)

    def load(self, df: pl.DataFrame, batch_id: str):
        return self.repository.insert_payment_records(df, batch_id=batch_id)
