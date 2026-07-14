from __future__ import annotations

import base64
import io
import logging
import os
import re
from pathlib import Path

log = logging.getLogger(__name__)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

SUPPORTED = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/csv": "csv",
    "image/jpeg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
}


def extract_text_from_pdf(data: bytes) -> str:
    try:
        import zipfile

        # Try as PDF with basic text extraction
        text = data.decode("latin-1", errors="ignore")
        # Extract readable strings
        parts = re.findall(r'[A-Za-z0-9\s\.,!?;:\'"()\-]{10,}', text)
        return " ".join(parts[:200])
    except Exception as e:
        return f"Could not extract PDF text: {e}"


def extract_text_from_docx(data: bytes) -> str:
    try:
        import xml.etree.ElementTree as ET
        import zipfile

        with zipfile.ZipFile(io.BytesIO(data)) as z:
            if "word/document.xml" not in z.namelist():
                return "Invalid DOCX file"
            xml_content = z.read("word/document.xml")
        root = ET.fromstring(xml_content)
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        paragraphs = []
        for para in root.iter(
            "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"
        ):
            texts = [
                t.text
                for t in para.iter(
                    "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"
                )
                if t.text
            ]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs[:100])
    except Exception as e:
        return f"Could not extract DOCX text: {e}"


def extract_text_from_csv(data: bytes) -> str:
    try:
        import csv

        text = data.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)[:20]
        return "\n".join([", ".join(row) for row in rows])
    except Exception as e:
        return f"Could not extract CSV: {e}"


def process_file(filename: str, content_type: str, data: bytes) -> dict:
    """Process uploaded file and return extracted content."""
    if len(data) > MAX_FILE_SIZE:
        return {"error": "File too large. Maximum 20MB allowed.", "type": "error"}

    file_type = SUPPORTED.get(content_type)
    if not file_type:
        # Try to detect by extension
        ext = Path(filename).suffix.lower()
        if ext == ".pdf":
            file_type = "pdf"
        elif ext in (".docx", ".doc"):
            file_type = "docx"
        elif ext in (".txt", ".md"):
            file_type = "txt"
        elif ext == ".csv":
            file_type = "csv"
        elif ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            file_type = "image"
        else:
            return {"error": f"Unsupported file type: {ext}", "type": "error"}

    if file_type == "image":
        b64 = base64.b64encode(data).decode()
        return {
            "type": "image",
            "base64": b64,
            "content_type": content_type,
            "filename": filename,
        }

    elif file_type == "pdf":
        text = extract_text_from_pdf(data)
        return {
            "type": "text",
            "content": text[:4000],
            "filename": filename,
            "file_type": "PDF",
        }

    elif file_type == "docx":
        text = extract_text_from_docx(data)
        return {
            "type": "text",
            "content": text[:4000],
            "filename": filename,
            "file_type": "Word Document",
        }

    elif file_type == "txt":
        text = data.decode("utf-8", errors="ignore")
        return {
            "type": "text",
            "content": text[:4000],
            "filename": filename,
            "file_type": "Text File",
        }

    elif file_type == "csv":
        text = extract_text_from_csv(data)
        return {
            "type": "text",
            "content": text[:4000],
            "filename": filename,
            "file_type": "CSV File",
        }

    return {"error": "Unknown error processing file", "type": "error"}
