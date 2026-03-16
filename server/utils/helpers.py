"""Shared utility helpers"""
from bson import ObjectId
from datetime import datetime
import re, math


def to_str_id(doc: dict) -> dict:
    """Convert MongoDB _id to string id in-place."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def paginate(page: int, limit: int, total: int) -> dict:
    return {
        "page":  page,
        "limit": limit,
        "total": total,
        "pages": math.ceil(total / limit) if limit else 1,
    }


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


def safe_object_id(value: str):
    """Return ObjectId or None if invalid."""
    try:
        return ObjectId(value)
    except Exception:
        return None


def utcnow() -> datetime:
    return datetime.utcnow()
