import uuid
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_db_session
from database.models import WarningThreshold


DEFAULT_THRESHOLDS = [
    {
        'metric_code': 'order_rejection_rate',
        'metric_name': '骑手拒单率',
        'metric_category': 'rider_behavior',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 0.15,
        'unit': '%',
        'description': '骑手拒单率超过15%触发预警'
    },
    {
        'metric_code': 'order_rejection_rate_warning',
        'metric_name': '骑手拒单率(警告)',
        'metric_category': 'rider_behavior',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 0.10,
        'unit': '%',
        'description': '骑手拒单率超过10%触发警告'
    },
    {
        'metric_code': 'compensation_per_order',
        'metric_name': '单均赔付金额',
        'metric_category': 'cost',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 8.00,
        'unit': '元',
        'description': '单均赔付金额超过8元触发预警'
    },
    {
        'metric_code': 'total_compensation_daily',
        'metric_name': '每日赔付总额',
        'metric_category': 'cost',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 500.00,
        'unit': '元',
        'description': '每日赔付总额超过500元触发预警'
    },
    {
        'metric_code': 'abnormal_amount_ratio',
        'metric_name': '异常订单金额占比',
        'metric_category': 'order_risk',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 0.05,
        'unit': '%',
        'description': '异常金额订单占比超过5%触发预警'
    },
    {
        'metric_code': 'delivery_timeout_rate',
        'metric_name': '配送超时率',
        'metric_category': 'efficiency',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 0.08,
        'unit': '%',
        'description': '配送超时率超过8%触发警告'
    },
    {
        'metric_code': 'order_cancel_rate',
        'metric_name': '订单取消率',
        'metric_category': 'order_risk',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 0.06,
        'unit': '%',
        'description': '订单取消率超过6%触发警告'
    },
    {
        'metric_code': 'rejection_count_hourly',
        'metric_name': '小时拒单频次',
        'metric_category': 'rider_behavior',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 3,
        'unit': '次/小时',
        'description': '单骑手小时拒单超过3次触发预警'
    },
    {
        'metric_code': 'avg_delivery_duration',
        'metric_name': '平均配送时长',
        'metric_category': 'efficiency',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 45,
        'unit': '分钟',
        'description': '平均配送时长超过45分钟触发警告'
    },
    {
        'metric_code': 'subsidy_abnormal_ratio',
        'metric_name': '补贴异常率',
        'metric_category': 'cost',
        'warning_level': 'high',
        'operator': '>',
        'threshold_value': 0.03,
        'unit': '%',
        'description': '补贴异常订单占比超过3%触发预警'
    },
    {
        'metric_code': 'address_abnormal_ratio',
        'metric_name': '地址异常率',
        'metric_category': 'order_risk',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 0.02,
        'unit': '%',
        'description': '地址异常订单占比超过2%触发警告'
    },
    {
        'metric_code': 'high_value_order_ratio',
        'metric_name': '高价值订单占比',
        'metric_category': 'order_risk',
        'warning_level': 'medium',
        'operator': '>',
        'threshold_value': 0.10,
        'unit': '%',
        'description': '高价值订单(>100元)占比超过10%触发警告'
    }
]


def init_warning_thresholds():
    with get_db_session() as session:
        existing = session.query(WarningThreshold.metric_code).all()
        existing_codes = {row[0] for row in existing}
        
        inserted_count = 0
        for threshold_data in DEFAULT_THRESHOLDS:
            if threshold_data['metric_code'] not in existing_codes:
                threshold = WarningThreshold(
                    threshold_id=str(uuid.uuid4()),
                    metric_code=threshold_data['metric_code'],
                    metric_name=threshold_data['metric_name'],
                    metric_category=threshold_data['metric_category'],
                    warning_level=threshold_data['warning_level'],
                    operator=threshold_data['operator'],
                    threshold_value=threshold_data['threshold_value'],
                    unit=threshold_data['unit'],
                    description=threshold_data['description'],
                    is_active=True,
                    updated_by='system_init',
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                session.add(threshold)
                inserted_count += 1
                print(f"已插入预警阈值: {threshold_data['metric_name']}")
            else:
                print(f"预警阈值已存在，跳过: {threshold_data['metric_name']}")
        
        session.commit()
        print(f"\n初始化完成！共插入 {inserted_count} 条预警阈值配置。")


if __name__ == '__main__':
    init_warning_thresholds()
