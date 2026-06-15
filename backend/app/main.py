from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, tags, courses, questions, study_progress, reminders, processing

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(study_progress.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(processing.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
