from __future__ import annotations
import urllib.request, urllib.parse, json, re, logging

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def search_duckduckgo(query: str, max_results: int = 5) -> list[dict]:
    """Search DuckDuckGo and return results."""
    try:
        params = urllib.parse.urlencode({"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"})
        url = f"https://api.duckduckgo.com/?{params}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        results = []

        # Abstract (main result)
        if data.get("AbstractText"):
            results.append({
                "title": data.get("Heading", "Result"),
                "snippet": data["AbstractText"],
                "url": data.get("AbstractURL", ""),
                "source": data.get("AbstractSource", ""),
            })

        # Related topics
        for topic in data.get("RelatedTopics", [])[:max_results]:
            if isinstance(topic, dict) and topic.get("Text"):
                results.append({
                    "title": topic.get("Text", "")[:80],
                    "snippet": topic.get("Text", ""),
                    "url": topic.get("FirstURL", ""),
                    "source": "DuckDuckGo",
                })

        return results[:max_results]
    except Exception as e:
        log.error("Search error: %s", e)
        return []

def format_search_context(query: str, results: list[dict]) -> str:
    if not results:
        return f"No search results found for: {query}"
    lines = [f"Web search results for: '{query}'\n"]
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. {r['title']}")
        lines.append(f"   {r['snippet']}")
        if r.get('url'):
            lines.append(f"   Source: {r['url']}")
        lines.append("")
    return "\n".join(lines)

def needs_web_search(message: str) -> bool:
    """Detect if the message needs a web search."""
    triggers = [
        "search", "find", "look up", "what is the latest", "current", "today",
        "news", "price of", "weather", "who is", "when did", "recent",
        "2024", "2025", "2026", "தேடு", "என்ன நடக்கிறது", "இப்போது",
    ]
    msg_lower = message.lower()
    return any(t in msg_lower for t in triggers)
