import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server.db import get_db
from server.models.user import User
from server.repositories.chat_repo import (
    create_chat,
    delete_chat,
    get_chat_with_messages,
    get_user_chats,
    user_owns_chat,
)
from server.services.auth_service import get_current_user
from server.services.chat_service import chat_stream, chat_sync
from server.services.file_service import process_file

router = APIRouter(prefix="/chat", tags=["chat"])

GENERIC_CHAT_ERROR = "The AI service is unavailable right now. Please try again shortly."


class Msg(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    history: list[dict] | None = None
    model: str | None = Field(default=None, max_length=100)
    chat_id: int | None = None
    enable_search: bool = False


@router.get("/history")
def history(u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"chats": get_user_chats(db, user_id=u.id)}


@router.get("/history/{chat_id}")
def get_chat(
    chat_id: int, u: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    c = get_chat_with_messages(db, chat_id=chat_id, user_id=u.id)
    if not c:
        raise HTTPException(404, "Chat not found")
    return c


@router.delete("/history/{chat_id}")
def del_chat(
    chat_id: int, u: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not delete_chat(db, chat_id=chat_id, user_id=u.id):
        raise HTTPException(404, "Chat not found")
    return {"deleted": True}


@router.post("")
def chat(req: Msg, u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = req.message.strip()
    if not msg:
        return {"response": "Empty message.", "error": True}
    try:
        r = chat_sync(
            db,
            message=msg,
            history=req.history or [],
            model=req.model,
            chat_id=req.chat_id,
            user_id=u.id,
            enable_search=req.enable_search,
        )
        return {"response": r["response"], "chat_id": r["chat_id"]}
    except ValueError as e:
        db.rollback()
        raise HTTPException(404, str(e)) from e
    except Exception:
        db.rollback()
        return {"response": GENERIC_CHAT_ERROR, "error": True}


@router.post("/stream")
def stream(
    req: Msg, u: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    msg = req.message.strip()
    if not msg:
        return StreamingResponse(iter(["Empty message."]), media_type="text/plain")

    if req.chat_id is not None and not user_owns_chat(
        db, chat_id=req.chat_id, user_id=u.id
    ):
        raise HTTPException(404, "Chat not found")

    chat_id = req.chat_id
    if chat_id is None:
        chat = create_chat(db, title=msg[:50], model=req.model, user_id=u.id)
        chat_id = chat.id

    def gen():
        try:
            for chunk, _ in chat_stream(
                db,
                message=msg,
                history=req.history or [],
                model=req.model,
                chat_id=chat_id,
                user_id=u.id,
                enable_search=req.enable_search,
            ):
                yield chunk
        except ValueError:
            db.rollback()
            yield "Chat not found."
        except Exception:
            db.rollback()
            yield GENERIC_CHAT_ERROR

    headers = {
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-Chat-ID": str(chat_id),
    }

    return StreamingResponse(
        gen(),
        media_type="text/plain",
        headers=headers,
    )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    message: str = Form(default="Analyze this file"),
    chat_id: Optional[str] = Form(default=None),
    model: Optional[str] = Form(default=None),
    history: Optional[str] = Form(default="[]"),
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await file.read()
    file_context = process_file(file.filename, file.content_type or "", data)

    if file_context.get("type") == "error":
        return {"response": f"❌ {file_context['error']}", "error": True}

    try:
        hist = json.loads(history or "[]")
    except:
        hist = []

    cid = int(chat_id) if chat_id and chat_id.isdigit() else None

    try:
        r = chat_sync(
            db,
            message=message,
            history=hist,
            model=model,
            chat_id=cid,
            user_id=u.id,
            file_context=file_context,
        )
        return {
            "response": r["response"],
            "chat_id": r["chat_id"],
            "file_name": file.filename,
            "file_type": file_context.get("file_type", file_context.get("type")),
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(404, str(e)) from e
    except Exception:
        db.rollback()
        return {"response": GENERIC_CHAT_ERROR, "error": True}


# ── Pin/Unpin chat ────────────────────────────────
@router.patch("/history/{chat_id}/pin")
def pin_chat(
    chat_id: int, u: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from server.models.chat import Chat

    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == u.id).first()
    if not chat:
        raise HTTPException(404, "Chat not found")
    # Toggle pin using title prefix
    if chat.title and chat.title.startswith("📌 "):
        chat.title = chat.title[3:]
    else:
        chat.title = f"📌 {chat.title or 'Chat'}"
    db.commit()
    return {"id": chat.id, "title": chat.title, "pinned": chat.title.startswith("📌 ")}


# ── Export chat ────────────────────────────────────
@router.get("/history/{chat_id}/export")
def export_chat(
    chat_id: int,
    fmt: str = "txt",
    u: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import PlainTextResponse

    from server.repositories.chat_repo import get_chat_with_messages

    chat = get_chat_with_messages(db, chat_id=chat_id, user_id=u.id)
    if not chat:
        raise HTTPException(404, "Chat not found")
    lines = [
        f"Kryonix AI — Chat Export",
        f"Title: {chat['title']}",
        f"Date: {chat['created_at']}",
        "=" * 50,
        "",
    ]
    for m in chat["messages"]:
        role = "You" if m["role"] == "user" else "Kryonix AI"
        lines.append(f"{role}:")
        lines.append(m["content"])
        lines.append("")
    return PlainTextResponse(
        "\n".join(lines),
        headers={"Content-Disposition": f'attachment; filename="chat-{chat_id}.txt"'},
    )
