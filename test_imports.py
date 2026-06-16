import sys
sys.path.insert(0, '.')

print('=== 数据库模块 ===')
from database import (
    Base, engine, SessionLocal,
    Patient, Appointment, PaymentDetail, ImageAttachment,
    AnomalyMarker, Remark, HisCaliberChange, RefreshLog,
    AppointmentStatus, AnomalyType
)
print('✓ 数据库模型全部导入成功')

print()
print('=== ETL模块 ===')
from etl.queries import DataQuerier
print('✓ 数据查询模块导入成功')

from etl.transformer import DataTransformer
print('✓ 数据转换模块导入成功')

from etl.funnel_analyzer import FunnelAnalyzer
print('✓ 漏斗分析模块导入成功')

from etl.anomaly_detector import AnomalyDetector
print('✓ 异常检测模块导入成功')

from etl.metrics import MetricsCalculator
print('✓ 指标计算模块导入成功')

print()
print('=== 仪表盘模块 ===')
from dashboard.app import app, server
print('✓ Dash应用导入成功')

from dashboard.layouts import (
    main_layout, funnel_dashboard, images_view,
    payments_view, patients_view, review_view
)
print('✓ 所有布局模块导入成功')

from dashboard.callbacks import register_callbacks
print('✓ 回调注册模块导入成功')

print()
print('=== Celery模块 ===')
from celery_tasks.data_tasks import detect_anomalies, sync_data, generate_report
print('✓ Celery任务模块导入成功')

print()
print('================================')
print('✓ 全部模块导入成功！')
print('================================')
