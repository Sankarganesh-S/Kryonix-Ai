import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from server.db import engine
from server.models.base import Base
from server.models.chat import Chat, ChatMessage  # noqa
from server.models.user import User  # noqa
from server.routes.admin import router as admin_router
from server.routes.auth import router as auth_router
from server.routes.chat import router as chat_router
from server.routes.user import router as user_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Kryonix AI API", version="3.0.0", lifespan=lifespan)

_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", ",".join(_default_origins)).split(",")
    if o.strip()
]

# Allow local network development hosts when running the frontend from a LAN IP.
_allow_origin_regex = r"^http://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+):5173$"
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "Kryonix AI API v3 ✅", "docs": "/docs"}
