from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from config import settings
from routers import (
    group_batch_router,
    arrival_list_router,
    pickup_code_router,
    after_sale_voucher_router,
    product_tag_router,
    exception_order_router,
    status_log_router,
    product_router,
    report_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="社区团购预售团单跟进台API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_PREFIX
app.include_router(group_batch_router, prefix=api_prefix)
app.include_router(arrival_list_router, prefix=api_prefix)
app.include_router(pickup_code_router, prefix=api_prefix)
app.include_router(after_sale_voucher_router, prefix=api_prefix)
app.include_router(product_tag_router, prefix=api_prefix)
app.include_router(exception_order_router, prefix=api_prefix)
app.include_router(status_log_router, prefix=api_prefix)
app.include_router(product_router, prefix=api_prefix)
app.include_router(report_router, prefix=api_prefix)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "服务正常运行"}


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }
