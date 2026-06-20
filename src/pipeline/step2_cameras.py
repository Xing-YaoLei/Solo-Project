import polars as pl
from datetime import date

from src.pipeline.base_step import PipelineStep
from src.data.simulator import DataSimulator


class CameraStatisticsStep(PipelineStep):
    def __init__(self):
        super().__init__(
            step_id="step2_cameras",
            step_name="摄像头统计数据",
            description="从摄像头系统获取客流统计"
        )
        self.simulator = DataSimulator()

    def _fetch_data(self, start_date: date, end_date: date) -> pl.DataFrame:
        return self.simulator.generate_camera_stats(start_date, end_date)

    def _save_to_duckdb(self, df: pl.DataFrame):
        self.db.conn.execute("""
            DELETE FROM camera_statistics
            WHERE stat_date BETWEEN (SELECT MIN(stat_date) FROM df)
                               AND (SELECT MAX(stat_date) FROM df)
        """)
        self.db.insert_dataframe(df, "camera_statistics")
