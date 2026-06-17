import logging
from app.utils.database import engine, Base
from app.models.schema import (
    ElderProfile, AdmissionAssessment, AccessRecord,
    CareTerminalRecord, BillingRecord, FallIncident,
    Medication, ReviewNote, DataSyncStatus, CaliberConflict
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_database():
    logger.info("开始创建数据库表...")
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建完成！")


if __name__ == "__main__":
    init_database()
