import json
import os
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server.db import get_db
from server.models.chat import Chat
from server.models.user import User
from server.services.auth_service import (get_current_user, hash_password,
                                          verify_password)

router = APIRouter(prefix="/user", tags=["user"])

AVATAR_COLORS = [
    "#7c6ef5",
    "#06b6d4",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
]

_UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "avatars"
_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
_MAX_BYTES = 2 * 1024 * 1024


class UpdateProfileReq(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    avatar_color: str | None = None
    accent_color: str | None = None


class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=100)


class PreferencesReq(BaseModel):
    preferences: dict[str, Any] | None = None


def _user_dict(u: User):
    return {
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "role": u.role,
        "is_verified": u.is_verified,
        "avatar_color": getattr(u, "avatar_color", "#7c6ef5") or "#7c6ef5",
        "accent_color": getattr(u, "accent_color", "#7c6ef5") or "#7c6ef5",
        "avatar_image": getattr(u, "avatar_image", None),
        "created_at": u.created_at.isoformat(),
    }


@router.get("/profile")
def get_profile(u: User = Depends(get_current_user)):
    return _user_dict(u)


@router.patch("/profile")
def update_profile(
    req: UpdateProfileReq,
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.username and req.username != u.username:
        if (
            db.query(User)
            .filter(User.username == req.username, User.id != u.id)
            .first()
        ):
            raise HTTPException(400, "Username already taken")
        u.username = req.username
    if req.avatar_color and req.avatar_color in AVATAR_COLORS:
        u.avatar_color = req.avatar_color
    if req.accent_color:
        u.accent_color = req.accent_color
    db.commit()
    return _user_dict(u)


@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(400, "No file provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in _ALLOWED_EXT:
        raise HTTPException(400, "Unsupported format. Use JPG, PNG, or WEBP")

    contents = await file.read()
    if len(contents) > _MAX_BYTES:
        raise HTTPException(400, "File too large. Max 2MB")

    if u.avatar_image:
        old = _UPLOAD_DIR / u.avatar_image
        if old.exists():
            try:
                old.unlink()
            except OSError:
                pass

    safe_name = f"{u.id}_{uuid.uuid4().hex}{ext}"
    dest = _UPLOAD_DIR / safe_name
    with open(dest, "wb") as f:
        f.write(contents)

    u.avatar_image = safe_name
    db.commit()

    return {
        "avatar_image": safe_name,
        "url": f"/api/static/avatars/{safe_name}",
    }


@router.delete("/profile-image")
def delete_profile_image(
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if u.avatar_image:
        old = _UPLOAD_DIR / u.avatar_image
        if old.exists():
            try:
                old.unlink()
            except OSError:
                pass
        u.avatar_image = None
        db.commit()
    return {"message": "Profile image removed"}


@router.get("/preferences")
def get_preferences(u: User = Depends(get_current_user)):
    try:
        prefs = json.loads(u.preferences) if u.preferences else {}
    except Exception:
        prefs = {}
    return {"preferences": prefs}


@router.patch("/preferences")
def update_preferences(
    req: PreferencesReq,
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    u.preferences = json.dumps(req.preferences or {})
    db.commit()
    return {"preferences": req.preferences or {}}


@router.post("/change-password")
def change_password(
    req: ChangePasswordReq,
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, u.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    u.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/stats")
def user_stats(u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == u.id).all()
    total_messages = sum(len(c.messages) for c in chats)
    return {
        "total_chats": len(chats),
        "total_messages": total_messages,
        "member_since": u.created_at.isoformat(),
    }


@router.delete("/account")
def delete_account(u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(u)
    db.commit()
    return {"message": "Account deleted"}
