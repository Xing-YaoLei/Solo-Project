from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .api import auth, members, benefits, transactions, tickets, plagiarism, summary
from .enums import (
    TicketStatus,
    TicketSource,
    ReviewTag,
    TransactionType,
    PlagiarismStatus,
    PlagiarismSeverity,
    MemberLevel,
)

app = FastAPI(title="职业教育学员社群跟进台API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(benefits.router)
app.include_router(transactions.router)
app.include_router(tickets.router)
app.include_router(plagiarism.router)
app.include_router(summary.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "职业教育学员社群跟进台API 运行正常"}


@app.get("/api/enums")
def get_all_enums():
    return {
        "TicketStatus": {e.name: e.value for e in TicketStatus},
        "TicketSource": {e.name: e.value for e in TicketSource},
        "ReviewTag": {e.name: e.value for e in ReviewTag},
        "TransactionType": {e.name: e.value for e in TransactionType},
        "PlagiarismStatus": {e.name: e.value for e in PlagiarismStatus},
        "PlagiarismSeverity": {e.name: e.value for e in PlagiarismSeverity},
        "MemberLevel": {e.name: e.value for e in MemberLevel},
    }
