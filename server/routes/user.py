from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from server.db import get_db
from server.models.user import User
from server.models.chat import Chat
from server.services.auth_service import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/user", tags=["user"])

AVATAR_COLORS = ["#7c6ef5","#06b6d4","#22c55e","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6"]

class UpdateProfileReq(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    avatar_color: str | None = None

class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=100)

def _user_dict(u: User):
    return {
        "id": u.id, "email": u.email, "username": u.username,
        "role": u.role, "is_verified": u.is_verified,
        "avatar_color": getattr(u, 'avatar_color', '#7c6ef5'),
        "created_at": u.created_at.isoformat()
    }

@router.get("/profile")
def get_profile(u: User = Depends(get_current_user)):
    return _user_dict(u)

@router.patch("/profile")
def update_profile(req: UpdateProfileReq, u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.username and req.username != u.username:
        if db.query(User).filter(User.username == req.username, User.id != u.id).first():
            raise HTTPException(400, "Username already taken")
        u.username = req.username
    if req.avatar_color and req.avatar_color in AVATAR_COLORS:
        if hasattr(u, 'avatar_color'):
            u.avatar_color = req.avatar_color
    db.commit()
    return _user_dict(u)

@router.post("/change-password")
def change_password(req: ChangePasswordReq, u: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
