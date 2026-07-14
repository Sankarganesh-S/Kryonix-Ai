from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Iterable

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava:7b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "180"))
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "60m")

SYSTEM_PROMPT = """You are Kryonix AI. You are a smart, helpful, and direct assistant.

IMPORTANT RULES — always follow these:
1. Always give a helpful, direct answer. Never refuse simple questions.
2. Never say "I'm sorry" or "I can't" — always TRY to help.
3. If you don't know something recent, say what you DO know about the topic, then suggest where to find current info.
4. Reply in the same language the user uses — Tamil, English, Hindi, etc.
5. For web search requests: say "I don't have live internet access, but here's what I know about [topic]:" then give useful information.
6. For images: describe them in detail.
7. For code: give complete, working code.
8. Be confident, friendly, and genuinely helpful — like a smart friend who always tries to help."""


def _request(messages, *, stream: bool, model=None):
    payload = {
        "model": model or OLLAMA_MODEL,
        "messages": messages,
        "stream": stream,
        "keep_alive": OLLAMA_KEEP_ALIVE,
        "options": {
            "temperature": 0.5,
            "top_p": 0.9,
            "num_ctx": 1024,
            "num_predict": 384,
            "num_batch": 128,
            "num_thread": 4,
        },
    }
    req = urllib.request.Request(
        f"{OLLAMA_HOST}/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        return urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT)
    except urllib.error.HTTPError as e:
        raise RuntimeError(
            f"Ollama HTTP {e.code}: {e.read().decode(errors='ignore')}"
        ) from e
    except urllib.error.URLError as e:
        raise RuntimeError(
            f"Cannot reach Ollama at {OLLAMA_HOST}. Run: ollama serve"
        ) from e


def build_messages(message: str, history=None, file_context=None, search_context=None):
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    model = OLLAMA_MODEL

    for item in (history or [])[-4:]:
        r, c = item.get("role"), item.get("content")
        if r in {"user", "assistant"} and c:
            msgs.append({"role": r, "content": str(c)[:400]})

    if file_context and file_context.get("type") == "image":
        model = OLLAMA_VISION_MODEL
        msgs.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": message or "Describe this image in detail.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{file_context['content_type']};base64,{file_context['base64']}"
                        },
                    },
                ],
            }
        )
    elif file_context and file_context.get("type") == "text":
        msgs.append(
            {
                "role": "user",
                "content": f"[File: {file_context['filename']}]\n{file_context['content'][:3000]}\n\nUser question: {message}",
            }
        )
    elif search_context:
        msgs.append(
            {
                "role": "user",
                "content": f"Here are web search results:\n{search_context}\n\nBased on this, answer: {message}",
            }
        )
    else:
        # Inject reminder for small models
        full_msg = f"{message}\n\n[Remember: Give a direct, helpful answer. Do not say you cannot help.]"
        msgs.append({"role": "user", "content": full_msg[:4000]})

    return msgs, model


def stream_ai_response(
    message: str, history=None, model=None, file_context=None, search_context=None
) -> Iterable[str]:
    msgs, detected_model = build_messages(
        message, history, file_context, search_context
    )
    use_model = model or detected_model
    try:
        resp = _request(msgs, stream=True, model=use_model)
        buffer = ""
        try:
            for raw in resp:
                line = raw.decode("utf-8", errors="ignore").strip()
                if not line:
                    continue
                data = json.loads(line)
                chunk = data.get("message", {}).get("content", "")
                if chunk:
                    buffer += chunk
                    if len(buffer) >= 30 or any(
                        buffer.endswith(c) for c in [".", "!", "?", "\n", ":", ";"]
                    ):
                        yield buffer
                        buffer = ""
                if data.get("done"):
                    if buffer:
                        yield buffer
                    break
        finally:
            getattr(resp, "close", lambda: None)()
    except Exception as e:
        yield f"\n\n⚠️ **Error:** {e}"


def get_ai_response(
    message: str, history=None, model=None, file_context=None, search_context=None
) -> str:
    msgs, detected_model = build_messages(
        message, history, file_context, search_context
    )
    try:
        resp = _request(msgs, stream=False, model=model or detected_model)
        try:
            data = json.loads(resp.read().decode())
        finally:
            getattr(resp, "close", lambda: None)()
        return data.get("message", {}).get("content", "").strip() or "No response."
    except Exception as e:
        return f"⚠️ Error: {e}"
