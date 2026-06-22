from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

from app.config import Config

DB_TYPE = os.getenv('DB_TYPE', 'postgresql')

if DB_TYPE == 'sqlite':
    engine = create_engine('sqlite:///audit_compliance.db', echo=False)
else:
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import app.models
    Base.metadata.create_all(bind=engine)


def register_models():
    import app.models
    return len(Base.metadata.tables)


def is_schema_initialized() -> bool:
    register_models()
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    expected_tables = set(Base.metadata.tables.keys())
    existing_tables = set(tables)
    return expected_tables.issubset(existing_tables) and len(tables) > 0


def check_database_connection() -> bool:
    try:
        with engine.connect() as conn:
            if DB_TYPE == 'postgresql':
                conn.execute(text("SELECT 1"))
            else:
                conn.execute(text("SELECT 1"))
            return True
    except Exception:
        return False


def ensure_database_ready() -> bool:
    if not check_database_connection():
        return False
    
    model_count = register_models()
    print(f'已注册模型数量: {model_count}')
    
    if not is_schema_initialized():
        print('检测到空数据库，开始初始化...')
        init_db()
        print('数据库表创建完成。')
        
        from utils.init_data import init_reference_data, generate_mock_data
        print('正在初始化基础数据...')
        init_reference_data()
        print('基础数据初始化完成。')
        
        print('正在生成模拟业务数据...')
        generate_mock_data()
        print('模拟数据生成完成。')
    return True
