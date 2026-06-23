from __future__ import annotations
import json, os, urllib.error, urllib.request, base64
from typing import Iterable

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava:7b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "180"))
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "60m")

SYSTEM_PROMPT = """You are Kryonix AI — a powerful, helpful, and friendly AI assistant.

CRITICAL RULES:
- NEVER say "I'm sorry, I'm just an AI" or "I don't have the capability"
- ALWAYS give a direct, useful, complete answer
- Be confident and solution-focused
- Reply in the same language the user writes in (Tamil, English, Hindi etc.)
- For images: describe them in detail and answer any questions about them
- For files: analyze the content thoroughly and answer questions
- For web search results: summarize and give insights
- For code: give complete, working, copy-ready code

You are Kryonix AI — built and hosted privately. Never mention OpenAI, ChatGPT, Claude."""

def _request(messages, *, stream: bool, model=None):
    payload = {
        "model": model or OLLAMA_MODEL,
        "messages": messages,
        "stream": stream,
        "keep_alive": OLLAMA_KEEP_ALIVE,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_ctx": 2048,
            "num_predict": 1024,
            "num_batch": 512,
            "num_thread": 4,
        }
    }
    req = urllib.request.Request(
        f"{OLLAMA_HOST}/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        return urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Ollama HTTP {e.code}: {e.read().decode(errors='ignore')}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Cannot reach Ollama at {OLLAMA_HOST}. Run: ollama serve") from e

def build_messages(message: str, history=None, file_context=None, search_context=None):
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    model = OLLAMA_MODEL

    for item in (history or [])[-6:]:
        r, c = item.get("role"), item.get("content")
        if r in {"user", "assistant"} and c:
            msgs.append({"role": r, "content": str(c)[:600]})

    if file_context and file_context.get("type") == "image":
        model = OLLAMA_VISION_MODEL
        user_content = [
            {"type": "text", "text": message or "Describe this image in detail."},
            {"type": "image_url", "image_url": {"url": f"data:{file_context['content_type']};base64,{file_context['base64']}"}}
        ]
        msgs.append({"role": "user", "content": user_content})
    elif file_context and file_context.get("type") == "text":
        file_info = f"[{file_context['file_type']}: {file_context['filename']}]\n\nContent:\n{file_context['content']}\n\n"
        msgs.append({"role": "user", "content": file_info + (message or "Analyze this.")})
    elif search_context:
        msgs.append({"role": "user", "content": f"{search_context}\n\nAnswer: {message}"})
    else:
        msgs.append({"role": "user", "content": message[:6000]})

    return msgs, model

def stream_ai_response(message: str, history=None, model=None, file_context=None, search_context=None) -> Iterable[str]:
    msgs, detected_model = build_messages(message, history, file_context, search_context)
    use_model = model or detected_model
    try:
        resp = _request(msgs, stream=True, model=use_model)
        # Collect into larger chunks before sending — 40 chars minimum
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
                    # Flush on sentence end, newline, or when buffer is big enough
                    if (len(buffer) >= 40 or
                        any(buffer.endswith(c) for c in ['.', '!', '?', '\n', ':', ';']) or
                        data.get("done")):
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

def get_ai_response(message: str, history=None, model=None, file_context=None, search_context=None) -> str:
    msgs, detected_model = build_messages(message, history, file_context, search_context)
    use_model = model or detected_model
    try:
        resp = _request(msgs, stream=False, model=use_model)
        try:
            data = json.loads(resp.read().decode())
        finally:
            getattr(resp, "close", lambda: None)()
        return data.get("message", {}).get("content", "").strip() or "No response."
    except Exception as e:
        return f"⚠️ Error: {e}"
