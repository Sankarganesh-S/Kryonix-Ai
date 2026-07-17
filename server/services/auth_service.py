from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from server.db import get_db
from server.models.user import User

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set. Refusing to run with insecure default.")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Default: 60 minutes. Override via JWT_EXPIRE_MINUTES.
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES)
    )
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise exc
        user_id_int = int(user_id)
    except (JWTError, TypeError, ValueError):
        raise exc

    user = db.query(User).filter(User.id == user_id_int).first()
    if not user or not user.is_active:
        raise exc
    # update last_seen (best-effort; don't block auth on DB write issues)
    try:
        user.last_seen = datetime.now(UTC)
        db.commit()
    except Exception:
        db.rollback()
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
