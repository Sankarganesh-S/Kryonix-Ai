import os
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from server.db import get_db
from server.models.chat import Chat, ChatMessage
from server.models.user import User
from server.services.auth_service import hash_password, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    verified_users = (
        db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    )
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_chats = db.query(func.count(Chat.id)).scalar()
    total_messages = db.query(func.count(ChatMessage.id)).scalar()
    # Users joined last 7 days
    since = datetime.now(UTC) - timedelta(days=7)
    new_users = db.query(func.count(User.id)).filter(User.created_at >= since).scalar()
    # Chats last 7 days
    new_chats = db.query(func.count(Chat.id)).filter(Chat.created_at >= since).scalar()
    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "active_users": active_users,
        "total_chats": total_chats,
        "total_messages": total_messages,
        "new_users_7d": new_users,
        "new_chats_7d": new_chats,
    }


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    users = (
        db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    )
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "role": u.role,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat(),
                "last_seen": u.last_seen.isoformat() if u.last_seen else None,
                "chat_count": len(u.chats),
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    chats = [
        {
            "id": c.id,
            "title": c.title,
            "model": c.model,
            "created_at": c.created_at.isoformat(),
            "message_count": len(c.messages),
        }
        for c in u.chats
    ]
    return {
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "role": u.role,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "created_at": u.created_at.isoformat(),
        "last_seen": u.last_seen.isoformat() if u.last_seen else None,
        "chats": chats,
    }


@router.patch("/users/{user_id}/toggle-active")
def toggle_active(
    user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == admin.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    u.is_active = not u.is_active
    db.commit()
    return {"id": u.id, "is_active": u.is_active}


@router.patch("/users/{user_id}/set-role")
def set_role(
    user_id: int, role: str, db: Session = Depends(get_db), admin=Depends(require_admin)
):
    if role not in ("user", "admin"):
        raise HTTPException(400, "Role must be 'user' or 'admin'")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.role = role
    db.commit()
    return {"id": u.id, "role": u.role}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == admin.id:
        raise HTTPException(400, "Cannot delete yourself")
    db.delete(u)
    db.commit()
    return {"deleted": True}


@router.get("/chats")
def list_chats(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    chats = (
        db.query(Chat).order_by(Chat.created_at.desc()).offset(skip).limit(limit).all()
    )
    return {
        "chats": [
            {
                "id": c.id,
                "title": c.title,
                "model": c.model,
                "user_id": c.user_id,
                "username": c.user.username if c.user else "deleted",
                "created_at": c.created_at.isoformat(),
                "message_count": len(c.messages),
            }
            for c in chats
        ]
    }


@router.post("/make-admin")
def make_first_admin(secret: str, email: str, db: Session = Depends(get_db)):
    """One-time endpoint to promote a user to admin using ADMIN_SECRET from .env"""
    admin_secret = os.getenv("ADMIN_SECRET", "")
    if not admin_secret:
        raise HTTPException(503, "Admin setup is not configured")
    if secret != admin_secret:
        raise HTTPException(403, "Invalid secret")
    u = db.query(User).filter(User.email == email.lower()).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.role = "admin"
    u.is_verified = True
    db.commit()
    return {"message": f"{u.username} is now admin", "role": u.role}
