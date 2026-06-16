import sys
print('Python版本:', sys.version)
print()
print('检查核心依赖...')
try:
    import dash
    print('✓ dash:', dash.__version__)
except ImportError as e:
    print('✗ dash:', e)
try:
    import dash_bootstrap_components as dbc
    print('✓ dash_bootstrap_components:', dbc.__version__)
except ImportError as e:
    print('✗ dash_bootstrap_components:', e)
try:
    import plotly
    print('✓ plotly:', plotly.__version__)
except ImportError as e:
    print('✗ plotly:', e)
try:
    import pandas as pd
    print('✓ pandas:', pd.__version__)
except ImportError as e:
    print('✗ pandas:', e)
try:
    import numpy as np
    print('✓ numpy:', np.__version__)
except ImportError as e:
    print('✗ numpy:', e)
try:
    import sqlalchemy
    print('✓ sqlalchemy:', sqlalchemy.__version__)
except ImportError as e:
    print('✗ sqlalchemy:', e)
try:
    import celery
    print('✓ celery:', celery.__version__)
except ImportError as e:
    print('✗ celery:', e)
try:
    import psycopg2
    print('✓ psycopg2: 已安装')
except ImportError as e:
    print('✗ psycopg2:', e)
try:
    import openpyxl
    print('✓ openpyxl: 已安装')
except ImportError as e:
    print('✗ openpyxl:', e)
print()
print('检查项目模块导入...')
try:
    from config import settings
    print('✓ config.settings')
except Exception as e:
    print('✗ config.settings:', e)
try:
    from database import models, connection
    print('✓ database.models, database.connection')
except Exception as e:
    print('✗ database:', e)
try:
    from etl import DataQuerier, DataTransformer, FunnelAnalyzer, AnomalyDetector, MetricsCalculator
    print('✓ etl 模块')
except Exception as e:
    print('✗ etl:', e)
try:
    from dashboard.layouts import serve_layout, FunnelDashboard, ImagesView, PaymentsView, PatientsView, ReviewView
    print('✓ dashboard.layouts')
except Exception as e:
    print('✗ dashboard.layouts:', e)
try:
    from dashboard.callbacks import register_callbacks
    print('✓ dashboard.callbacks')
except Exception as e:
    print('✗ dashboard.callbacks:', e)
try:
    from celery_tasks import data_tasks, scheduler
    print('✓ celery_tasks')
except Exception as e:
    print('✗ celery_tasks:', e)
print()
print('导入测试完成！')
