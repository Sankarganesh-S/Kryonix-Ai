from __future__ import annotations

import datetime
import enum
import os

from sqlalchemy import Boolean, Column, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from server.models.base import Base


def utc_now():
    return datetime.datetime.now(datetime.UTC)


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now
    )
    last_seen: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    avatar_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_color: Mapped[str] = mapped_column(
        String(20), default="#7c6ef5", nullable=False
    )
    accent_color: Mapped[str] = mapped_column(
        String(20), default="#7c6ef5", nullable=False
    )
    preferences: Mapped[str | None] = mapped_column(Text, nullable=True)

    chats: Mapped[list] = relationship(
        "Chat", back_populates="user", cascade="all, delete-orphan"
    )
