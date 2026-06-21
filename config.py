import os
from datetime import timedelta


class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = os.environ.get('SECRET_KEY', 'legal-risk-monitor-secret-key-2026')

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/legal_risk_monitor'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 300,
        'pool_pre_ping': True
    }

    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
    CELERY_TIMEZONE = 'Asia/Shanghai'
    CELERY_ENABLE_UTC = True

    CELERY_BEAT_SCHEDULE = {
        'fetch-email-attachments': {
            'task': 'app.tasks.data_sync.fetch_email_attachments',
            'schedule': timedelta(minutes=30),
        },
        'sync-calendar-events': {
            'task': 'app.tasks.data_sync.sync_calendar_events',
            'schedule': timedelta(hours=1),
        },
        'import-payment-transactions': {
            'task': 'app.tasks.data_sync.import_payment_transactions',
            'schedule': timedelta(hours=2),
        },
        'detect-hearing-anomalies': {
            'task': 'app.tasks.anomaly_detect.detect_hearing_anomalies',
            'schedule': timedelta(minutes=15),
        },
        'refresh-materialized-views': {
            'task': 'app.tasks.data_sync.refresh_materialized_views',
            'schedule': timedelta(minutes=10),
        },
    }

    EMAIL_IMAP_SERVER = os.environ.get('EMAIL_IMAP_SERVER', 'imap.exmail.qq.com')
    EMAIL_IMAP_PORT = int(os.environ.get('EMAIL_IMAP_PORT', 993))
    EMAIL_USER = os.environ.get('EMAIL_USER', 'legal@example.com')
    EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
    EMAIL_ATTACHMENT_DIR = os.path.join(BASE_DIR, 'data', 'attachments')

    CALENDAR_ICS_URL = os.environ.get('CALENDAR_ICS_URL', '')
    CALENDAR_WEBDAV_URL = os.environ.get('CALENDAR_WEBDAV_URL', '')

    PAYMENT_BANK_STATEMENT_DIR = os.path.join(BASE_DIR, 'data', 'bank_statements')
    PAYMENT_ALIPAY_DIR = os.path.join(BASE_DIR, 'data', 'alipay')
    PAYMENT_WECHAT_DIR = os.path.join(BASE_DIR, 'data', 'wechat')

    EXPORT_DIR = os.path.join(BASE_DIR, 'data', 'exports')
    EXPORT_CALIBER_NOTES = {
        'case_stage': {
            '咨询': '客户首次咨询，未签订委托合同',
            '立案': '委托合同签订，已完成法院立案',
            '举证': '已提交证据材料，等待举证期限届满',
            '开庭': '已确定开庭时间，等待庭审',
            '调解': '进入调解程序，等待调解结果',
            '判决': '已收到一审判决书',
            '上诉': '已提交上诉状，进入二审程序',
            '执行': '判决生效，进入执行阶段',
            '结案归档': '案件全部程序结束，已归档',
        },
        'payment_status': {
            '未收款': '委托合同约定款项尚未收到',
            '部分收款': '已收到部分约定款项',
            '已结清': '全部约定款项已收讫',
            '逾期': '超过约定付款期限仍未足额收取',
        },
        'evidence_status': {
            '待收集': '证据清单已列，尚未收集',
            '已收集': '证据原件/复印件已收齐',
            '已提交': '已向法院/仲裁委提交',
            '已质证': '对方已发表质证意见',
            '存疑': '证据真实性/合法性/关联性存在疑问',
        },
        'hearing_status': {
            '排期中': '已立案，尚未确定开庭时间',
            '已排期': '开庭时间已确定',
            '正常': '开庭时间临近，无异常',
            '冲突': '同一律师/团队存在时间冲突',
            '临近未准备': '距开庭不足72小时，关键材料未就绪',
            '已完成': '本次庭审已结束',
            '已改期': '原开庭时间已变更',
        }
    }

    ROLE_PERMISSIONS = {
        'admin': {
            'scope': 'all',
            'can_export': True,
            'can_share': True,
            'can_view_finance': True,
            'can_view_all_clients': True,
            'can_manage_users': True,
        },
        'partner': {
            'scope': 'department',
            'can_export': True,
            'can_share': True,
            'can_view_finance': True,
            'can_view_all_clients': True,
            'can_manage_users': False,
        },
        'lawyer': {
            'scope': 'assigned',
            'can_export': True,
            'can_share': True,
            'can_view_finance': False,
            'can_view_all_clients': False,
            'can_manage_users': False,
        },
        'paralegal': {
            'scope': 'team',
            'can_export': False,
            'can_share': False,
            'can_view_finance': False,
            'can_view_all_clients': False,
            'can_manage_users': False,
        },
        'client': {
            'scope': 'own_cases',
            'can_export': True,
            'can_share': False,
            'can_view_finance': True,
            'can_view_all_clients': False,
            'can_manage_users': False,
        },
        'auditor': {
            'scope': 'all_readonly',
            'can_export': True,
            'can_share': False,
            'can_view_finance': True,
            'can_view_all_clients': True,
            'can_manage_users': False,
        }
    }

    SHARE_LINK_TTL_HOURS = 72
    DASH_UPDATE_INTERVAL_SECONDS = 300

    os.makedirs(EMAIL_ATTACHMENT_DIR, exist_ok=True)
    os.makedirs(PAYMENT_BANK_STATEMENT_DIR, exist_ok=True)
    os.makedirs(PAYMENT_ALIPAY_DIR, exist_ok=True)
    os.makedirs(PAYMENT_WECHAT_DIR, exist_ok=True)
    os.makedirs(EXPORT_DIR, exist_ok=True)


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
