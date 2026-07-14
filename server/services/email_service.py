import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer

load_dotenv()
log = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Kryonix AI <noreply@kryonix.ai>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

OTP_EMAIL_SUBJECT_REGISTER = os.getenv(
    "OTP_EMAIL_SUBJECT_REGISTER",
    "Confirm your Kryonix AI registration",
)
OTP_EMAIL_SUBJECT_LOGIN = os.getenv(
    "OTP_EMAIL_SUBJECT_LOGIN",
    "Your Kryonix AI sign-in code",
)
OTP_EMAIL_SUBJECT_RESET = os.getenv(
    "OTP_EMAIL_SUBJECT_RESET",
    "Reset your Kryonix AI password",
)

_serializer = URLSafeTimedSerializer(SECRET_KEY)


def generate_verification_token(email: str) -> str:
    return _serializer.dumps(email, salt="email-verify")


def verify_email_token(token: str, max_age: int = 86400) -> str | None:
    try:
        return _serializer.loads(token, salt="email-verify", max_age=max_age)
    except Exception:
        return None


def _send(to: str, subject: str, html: str):
    if not SMTP_USER or not SMTP_PASS:
        log.warning("SMTP not configured — skipping email to %s", to)
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.ehlo()
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, to, msg.as_string())
        log.info("Email sent to %s", to)
    except Exception as e:
        log.error("Failed to send email: %s", e)


def send_verification_email(to: str, username: str):
    token = generate_verification_token(to)
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#0e0f16;color:#fafafa;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c6ef5,#5b4de0);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:24px">✦ Kryonix AI</h1>
        <p style="margin:8px 0 0;opacity:.8">Verify your email</p>
      </div>
      <div style="padding:32px">
        <p>Hi <strong>{username}</strong>,</p>
        <p>Thanks for creating your Kryonix account. Click below to verify your email and start chatting.</p>
        <a href="{link}" style="display:inline-block;margin:20px 0;padding:14px 32px;background:linear-gradient(135deg,#7c6ef5,#5b4de0);color:white;border-radius:12px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#71717a;font-size:13px">Link expires in 24 hours. If you didn't create this account, ignore this email.</p>
      </div>
    </div>
    """
    _send(to, "Verify your Kryonix AI email", html)


def send_welcome_email(to: str, username: str):
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#0e0f16;color:#fafafa;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c6ef5,#5b4de0);padding:32px;text-align:center">
        <h1 style="margin:0;font-size:24px">✦ Kryonix AI</h1>
      </div>
      <div style="padding:32px">
        <p>Hi <strong>{username}</strong> 🎉</p>
        <p>Your email is verified. You can now use Kryonix AI — your personal AI assistant powered entirely by your own server.</p>
        <a href="{FRONTEND_URL}/chat" style="display:inline-block;margin:20px 0;padding:14px 32px;background:linear-gradient(135deg,#7c6ef5,#5b4de0);color:white;border-radius:12px;text-decoration:none;font-weight:600">
          Start Chatting
        </a>
      </div>
    </div>
    """
    _send(to, "Welcome to Kryonix AI 🎉", html)
