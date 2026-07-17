from __future__ import annotations

import logging
import os
import secrets
import string
import time

from server.services.email_service import (
    _send,
    OTP_EMAIL_SUBJECT_LOGIN,
    OTP_EMAIL_SUBJECT_REGISTER,
    OTP_EMAIL_SUBJECT_RESET,
)

log = logging.getLogger(__name__)

# In-memory OTP store: { email: { otp, expires_at, attempts } }
_store: dict[str, dict] = {}

OTP_EXPIRY = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 5


def _gen_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_and_send_otp(email: str, username: str, purpose: str = "login") -> tuple[bool, str]:
    otp = _gen_otp()
    _store[email] = {
        "otp": otp,
        "purpose": purpose,
        "expires_at": time.time() + OTP_EXPIRY,
        "attempts": 0,
    }
    action_label = {
        "register": "confirm your registration",
        "login": "sign in",
        "reset": "reset your password",
    }.get(purpose, "access your account")
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#0e0f16;color:#fafafa;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c6ef5,#5b4de0);padding:28px 32px;text-align:center">
        <h1 style="margin:0;font-size:22px;font-weight:700">✦ Kryonix AI</h1>
        <p style="margin:8px 0 0;opacity:.8;font-size:14px">Your verification code</p>
      </div>
      <div style="padding:32px">
        <p style="margin:0 0 8px">Hi <strong>{username}</strong>,</p>
        <p style="color:#a1a1aa;font-size:14px">Use this OTP to {action_label} on Kryonix AI:</p>
        <div style="margin:28px 0;text-align:center">
          <div style="display:inline-block;background:#1a1a2e;border:2px solid #7c6ef5;border-radius:16px;padding:20px 40px">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#a78bfa;font-family:monospace">{otp}</span>
          </div>
        </div>
        <p style="color:#71717a;font-size:13px;text-align:center">⏱ Expires in 5 minutes &nbsp;|&nbsp; Do not share this code</p>
      </div>
    </div>
    """
    subject = OTP_EMAIL_SUBJECT_REGISTER if purpose == "register" else OTP_EMAIL_SUBJECT_LOGIN
    if purpose == "reset":
        subject = OTP_EMAIL_SUBJECT_RESET

    try:
        # _send() is responsible for logging.
        result = _send(email, subject, html)
        if not result:
            return False, "Failed to send OTP email"
        return True, "OTP email sent"
    except Exception as e:
        log.exception("Failed to send OTP: %s", e)
        return False, "Failed to send OTP email"



def verify_otp(email: str, otp: str, purpose: str) -> tuple[bool, str]:
    record = _store.get(email)
    if not record:
        return False, "No OTP requested for this email"
    if time.time() > record["expires_at"]:
        del _store[email]
        return False, "OTP expired. Please request a new one"
    if record.get("purpose") != purpose:
        return False, "This OTP was requested for a different action"
    record["attempts"] += 1
    if record["attempts"] > OTP_MAX_ATTEMPTS:
        del _store[email]
        return False, "Too many attempts. Please request a new OTP"
    if not secrets.compare_digest(record["otp"], otp.strip()):
        return (
            False,
            f"Invalid OTP. {OTP_MAX_ATTEMPTS - record['attempts']} attempts left",
        )
    del _store[email]
    return True, "OTP verified"
