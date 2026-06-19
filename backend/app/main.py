from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import complaints, responsibilities, reviews, stats, visit_results


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="旅游民宿客诉处理跟进台", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(visit_results.router)
app.include_router(responsibilities.router)
app.include_router(reviews.router)
app.include_router(stats.router)


@app.get("/")
async def root():
    return {"message": "旅游民宿客诉处理跟进台 API"}
