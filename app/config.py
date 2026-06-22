import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'audit_compliance')
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DASH_DEBUG = os.getenv('DASH_DEBUG', 'True') == 'True'
    
    DATA_IMPORT_DIR = os.getenv('DATA_IMPORT_DIR', './data/import')
    EXPORT_DIR = os.getenv('EXPORT_DIR', './data/export')
    
    COLORS = {
        'primary': '#1e3a5f',
        'success': '#2d6a4f',
        'danger': '#d62828',
        'warning': '#f77f00',
        'secondary': '#6c757d',
        'info': '#0077b6',
        'light': '#f8f9fa',
        'dark': '#212529'
    }
    
    RISK_COLORS = {
        'critical': '#d62828',
        'high': '#f77f00',
        'medium': '#f4a261',
        'low': '#2d6a4f',
        'info': '#6c757d'
    }
    
    STATUS_COLORS = {
        'pending': '#f77f00',
        'in_progress': '#0077b6',
        'verified': '#2d6a4f',
        'resolved': '#2d6a4f',
        'closed': '#6c757d',
        'overdue': '#d62828'
    }
