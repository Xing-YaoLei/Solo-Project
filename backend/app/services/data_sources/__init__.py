from .base import DataSourceConnector, DataSourceRegistry
from .postgres_source import PostgresDataSource
from .live_platform_source import LivePlatformDataSource
from .employment_source import EmploymentDataSource
from .lms_source import LMSDataSource


postgres_source = PostgresDataSource()
live_platform_source = LivePlatformDataSource()
employment_source = EmploymentDataSource()
lms_source = LMSDataSource()

DataSourceRegistry.register(postgres_source)
DataSourceRegistry.register(live_platform_source)
DataSourceRegistry.register(employment_source)
DataSourceRegistry.register(lms_source)


__all__ = [
    "DataSourceConnector",
    "DataSourceRegistry",
    "PostgresDataSource",
    "LivePlatformDataSource",
    "EmploymentDataSource",
    "LMSDataSource",
    "postgres_source",
    "live_platform_source",
    "employment_source",
    "lms_source"
]
