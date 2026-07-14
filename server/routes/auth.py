import os
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from server.db import get_db
from server.models.user import User
from server.services.auth_service import (create_access_token,
                                          get_current_user, hash_password,
                                          verify_password)
from server.services.otp_service import generate_and_send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterReq(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)
    admin_secret: str | None = None


class LoginReq(BaseModel):
    email: str
    password: str


class OTPReq(BaseModel):
    email: str
    otp: str


class RequestOTPReq(BaseModel):
    email: str


def _user_dict(u: User):
    return {
        "id": u.id,
        "email": u.email,
        "username": u.username,
        "role": u.role,
        "is_verified": u.is_verified,
    }


# ── Step 1: Register — save user, send OTP
@router.post("/register", status_code=201)
def register(req: RegisterReq, bg: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken")
    user = User(
        email=req.email.lower(),
        username=req.username,
        hashed_password=hash_password(req.password),
    )
    admin_secret_valid = bool(
        req.admin_secret and req.admin_secret == os.getenv("ADMIN_SECRET", "")
    )
    if admin_secret_valid:
        user.role = "admin"
        user.is_verified = True

    db.add(user)
    db.commit()
    db.refresh(user)

    smtp_configured = bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))
    if smtp_configured and not admin_secret_valid:
        bg.add_task(generate_and_send_otp, user.email, user.username, "register")
        return {
            "message": "OTP sent to your email. Please verify to continue.",
            "requires_otp": True,
            "email": user.email,
        }

    # No SMTP configured or first admin signup via secret: auto verify and login
    user.is_verified = True
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_dict(user),
        "requires_otp": False,
    }


# ── Step 2: Verify OTP after register
@router.post("/verify-otp")
def verify_otp_route(req: OTPReq, db: Session = Depends(get_db)):
    ok, msg = verify_otp(req.email.lower(), req.otp, "register")
    if not ok:
        raise HTTPException(400, msg)
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_verified = True
    user.last_seen = datetime.now(UTC)
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


# ── Login Step 1: verify password, send OTP
@router.post("/login")
def login(req: LoginReq, bg: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account disabled. Contact admin.")

    smtp_configured = bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))
    if smtp_configured:
        bg.add_task(generate_and_send_otp, user.email, user.username, "login")
        return {
            "message": "OTP sent to your email",
            "requires_otp": True,
            "email": user.email,
        }
    else:
        # No SMTP — login directly
        token = create_access_token({"sub": str(user.id)})
        user.last_seen = datetime.now(UTC)
        db.commit()
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": _user_dict(user),
            "requires_otp": False,
        }


# ── Login Step 2: verify OTP, return token
@router.post("/login-otp")
def login_otp(req: OTPReq, db: Session = Depends(get_db)):
    ok, msg = verify_otp(req.email.lower(), req.otp, "login")
    if not ok:
        raise HTTPException(400, msg)
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.last_seen = datetime.now(UTC)
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


# ── Resend OTP
@router.post("/resend-otp")
def resend_otp(req: RequestOTPReq, bg: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(404, "User not found")
    bg.add_task(generate_and_send_otp, user.email, user.username, "login")
    return {"message": "OTP resent to your email"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


# ── Forgot Password — Step 1: send OTP
@router.post("/forgot-password")
def forgot_password(
    req: RequestOTPReq, bg: BackgroundTasks, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(404, "No account found with this email")
    bg.add_task(generate_and_send_otp, user.email, user.username, "reset")
    return {
        "message": "OTP sent to your email",
        "requires_otp": True,
        "email": user.email,
    }


# ── Forgot Password — Step 2: verify OTP + set new password
class ResetPasswordReq(BaseModel):
    email: str
    otp: str
    new_password: str = Field(min_length=6, max_length=100)


@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    ok, msg = verify_otp(req.email.lower(), req.otp, "reset")
    if not ok:
        raise HTTPException(400, msg)
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.hashed_password = hash_password(req.new_password)
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_dict(user),
        "message": "Password reset successful",
    }
