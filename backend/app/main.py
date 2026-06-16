from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import get_settings
from .services.mock_data import init_mock_data
from .routers import analytics, share, meta, data_sources

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="职业教育题库练习风险监测系统 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router, prefix="/api")
app.include_router(share.router, prefix="/api")
app.include_router(meta.router, prefix="/api")
app.include_router(data_sources.router)


@app.on_event("startup")
async def startup_event():
    init_mock_data()


@app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "version": "1.0.0",
        "completion_rate_formula": settings.COMPLETION_RATE_FORMULA
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
