import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from server.db import engine
from server.models.base import Base
from server.models.user import User   # noqa
from server.models.chat import Chat, ChatMessage  # noqa
from server.routes.auth import router as auth_router
from server.routes.chat import router as chat_router
from server.routes.admin import router as admin_router

@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Kryonix AI API", version="3.0.0", lifespan=lifespan)

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "Kryonix AI API v3 ✅", "docs": "/docs"}
