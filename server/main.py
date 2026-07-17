import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

load_dotenv()

from server.db import engine
from server.models.base import Base
from server.models.chat import Chat, ChatMessage  # noqa
from server.models.user import User  # noqa
from server.routes.admin import router as admin_router
from server.routes.auth import router as auth_router
from server.routes.chat import router as chat_router
from server.routes.user import router as user_router


def _migrate():
    insp = inspect(engine)
    if not insp.has_table("users"):
        return
    cols = [c["name"] for c in insp.get_columns("users")]
    with engine.begin() as conn:
        if "avatar_image" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_image TEXT"))
        if "avatar_color" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_color VARCHAR(20) DEFAULT '#7c6ef5' NOT NULL"))
        if "accent_color" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN accent_color VARCHAR(20) DEFAULT '#7c6ef5' NOT NULL"))
        if "preferences" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN preferences TEXT"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate()
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
_allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
# Use an explicit header list to reduce CORS attack surface.
_allow_headers = ["Authorization", "Content-Type"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_credentials=True,
    allow_methods=_allow_methods,
    allow_headers=_allow_headers,
)


app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(admin_router)
app.include_router(user_router)

_upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "avatars")
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/api/static/avatars", StaticFiles(directory=_upload_dir), name="avatar-static")


# Baseline security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Permissions-Policy"] = "geolocation=()"
    return response


@app.get("/")
def root():
    return {"message": "Kryonix AI API v3 ✅", "docs": "/docs"}
