from __future__ import annotations
from sqlalchemy.orm import Session
from server.services.ai_service import get_ai_response, stream_ai_response
from server.services.web_search_service import search_duckduckgo, format_search_context, needs_web_search
from server.repositories.chat_repo import add_message, create_chat

def _clean(history):
    return [{"role": i["role"], "content": str(i["content"])} for i in (history or []) if i.get("role") and i.get("content")]

def chat_sync(db, *, message, history, model, chat_id, user_id=None, file_context=None, enable_search=False):
    if chat_id is None:
        chat = create_chat(db, title=message[:50], model=model, user_id=user_id)
        chat_id = chat.id
    add_message(db, chat_id=chat_id, role="user", content=message)
    db.commit()

    search_context = None
    if enable_search or needs_web_search(message):
        results = search_duckduckgo(message)
        if results:
            search_context = format_search_context(message, results)

    reply = get_ai_response(message, _clean(history), model, file_context=file_context, search_context=search_context)
    add_message(db, chat_id=chat_id, role="assistant", content=reply)
    db.commit()
    return {"chat_id": chat_id, "response": reply}

def chat_stream(db, *, message, history, model, chat_id, user_id=None, file_context=None, enable_search=False):
    if chat_id is None:
        chat = create_chat(db, title=message[:50], model=model, user_id=user_id)
        chat_id = chat.id
    add_message(db, chat_id=chat_id, role="user", content=message)
    db.commit()

    search_context = None
    if enable_search or needs_web_search(message):
        results = search_duckduckgo(message)
        if results:
            search_context = format_search_context(message, results)

    chunks = []
    try:
        for chunk in stream_ai_response(message, _clean(history), model, file_context=file_context, search_context=search_context):
            chunks.append(chunk)
            yield chunk, chat_id
    finally:
        reply = "".join(chunks).strip()
        if reply:
            add_message(db, chat_id=chat_id, role="assistant", content=reply)
            db.commit()
