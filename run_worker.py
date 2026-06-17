#!/usr/bin/env python
"""启动Celery Worker处理数据导入任务"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


if __name__ == '__main__':
    from celery import group
    from app.tasks import (
        import_crm_properties_task, import_crm_tenants_task,
        import_contracts_task, import_meter_readings_task,
        import_repair_records_task,
    )
    from app.celery_app import celery

    argv = [
        'worker',
        '--loglevel=info',
        '--concurrency=4',
        '--pool=prefork',
        '-Q', 'default,imports',
    ]
    celery.worker_main(argv)
