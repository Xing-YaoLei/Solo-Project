from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, quotes, invoices, approvals, payments, exceptions as exc_router, attachments, statistics


def create_app() -> FastAPI:
    app = FastAPI(
        title="法律服务费用报价跟进台 API",
        description="用于整理费用报价流程，支持单据明细、审批节点、金额校验和支付流水管理",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    @app.get("/api/health")
    async def health_check():
        return {"status": "ok", "version": "0.1.0"}

    app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
    app.include_router(quotes.router, prefix="/api/quotes", tags=["报价单"])
    app.include_router(invoices.router, prefix="/api/invoices", tags=["单据明细"])
    app.include_router(approvals.router, prefix="/api/approvals", tags=["审批节点"])
    app.include_router(payments.router, prefix="/api/payments", tags=["支付流水"])
    app.include_router(exc_router.router, prefix="/api/exceptions", tags=["异常处理"])
    app.include_router(attachments.router, prefix="/api/attachments", tags=["附件"])
    app.include_router(statistics.router, prefix="/api/statistics", tags=["统计分析"])

    return app


app = create_app()
