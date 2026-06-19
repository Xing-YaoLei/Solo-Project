from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import time_slots, reservations, conflicts, misc

Base.metadata.create_all(bind=engine)

app = FastAPI(title="景区门票预约跟进台 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(time_slots.router)
app.include_router(reservations.router)
app.include_router(conflicts.router)
app.include_router(misc.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "景区门票预约跟进台 API 运行正常"}
