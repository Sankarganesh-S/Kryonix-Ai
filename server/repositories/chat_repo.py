from __future__ import annotations
from sqlalchemy.orm import Session
from server.models.chat import Chat, ChatMessage

def create_chat(db, *, title=None, model=None, user_id=None):
    c = Chat(title=title, model=model, user_id=user_id); db.add(c); db.flush(); return c

def add_message(db, *, chat_id, role, content, is_error=False):
    m = ChatMessage(chat_id=chat_id, role=role, content=content, is_error=is_error); db.add(m); return m

def get_user_chats(db: Session, *, user_id: int):
    chats = db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.created_at.desc()).all()
    return [{"id": c.id, "title": c.title or "New Chat", "model": c.model, "created_at": c.created_at.isoformat(), "message_count": len(c.messages)} for c in chats]

def get_chat_with_messages(db: Session, *, chat_id: int, user_id: int):
    c = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not c: return None
    return {"id": c.id, "title": c.title or "New Chat", "model": c.model, "created_at": c.created_at.isoformat(),
            "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in c.messages if m.role in ("user","assistant")]}

def delete_chat(db: Session, *, chat_id: int, user_id: int):
    c = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not c: return False
    db.delete(c); db.commit(); return True
