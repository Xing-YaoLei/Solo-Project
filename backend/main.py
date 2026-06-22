from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.utils.init_data import init_default_user
from app.api.routers import (
    auth_router,
    checklist_router,
    sampling_router,
    rectification_router,
    vendor_router,
    exception_router,
    export_router,
    dashboard_router,
)


def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ 数据库表创建成功")
    except Exception as e:
        print(f"⚠️  数据库表创建失败（请确保PostgreSQL已启动）: {e}")
        print("💡 提示: 运行 `docker compose up -d` 启动PostgreSQL和Redis")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="合规审计系统 API - 支持检查清单管理、抽样记录、整改计划、供应商管理、异常单处理及数据导出等功能",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    create_tables()

    try:
        db = SessionLocal()
        init_default_user(db)
        db.close()
    except Exception as e:
        print(f"⚠️  初始化默认用户失败（数据库可能未就绪）: {e}")

    app.include_router(auth_router)
    app.include_router(dashboard_router)
    app.include_router(checklist_router)
    app.include_router(sampling_router)
    app.include_router(rectification_router)
    app.include_router(vendor_router)
    app.include_router(exception_router)
    app.include_router(export_router)

    @app.get("/", tags=["系统"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
            "docs": "/docs",
            "redoc": "/redoc"
        }

    @app.get("/health", tags=["系统"])
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_application()
