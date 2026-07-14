# Kryonix AI v3 — Setup Guide (Windows)

## Step 1 — Install PostgreSQL
Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

After installing, open pgAdmin or psql and run:
```sql
CREATE DATABASE kryonix;
```

## Step 2 — Install Ollama
Download from: https://ollama.com/download
After installing, open Command Prompt and run:
```bash
ollama pull llama3.1:8b
```

> If you want a faster lightweight option, you can also pull `qwen2.5:1.5b` instead.

## Step 3 — Set up backend .env
Copy `server/.env.example` to `server/.env` and fill in:

```
DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/kryonix
JWT_SECRET_KEY=   <-- run: python -c "import secrets; print(secrets.token_hex(32))"
SMTP_USER=you@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=Kryonix AI <you@gmail.com>
OTP_EMAIL_SUBJECT_REGISTER=Confirm your Kryonix AI registration
OTP_EMAIL_SUBJECT_LOGIN=Your Kryonix AI sign-in code
OTP_EMAIL_SUBJECT_RESET=Reset your Kryonix AI password
ADMIN_SECRET=any-secret-word-you-choose
```

> Gmail App Password: https://myaccount.google.com/apppasswords
> (Enable 2FA first, then create an App Password for "Mail")

## Step 4 — Install Python packages
```bash
cd Kryonix-v3
python -m venv venv
venv\Scripts\activate
pip install -r server/requirements.txt
```

## Step 5 — Start Ollama
```bash
ollama serve
```
Keep this terminal open.

## Step 6 — Start the backend
Open a new terminal:
```bash
cd Kryonix-v3
venv\Scripts\activate
uvicorn server.main:app --reload --port 8000
```
Visit http://localhost:8000 → should show: `"Kryonix API v3 ✅"`

## Step 7 — Start the frontend
Open another new terminal:
```bash
cd Kryonix-v3/client
npm install
npm run dev
```
Visit http://localhost:5173 → Login page appears!

## Step 8 — Create your admin account
1. Register at http://localhost:5173/register
2. Enter the `ADMIN_SECRET` on the registration form to create the first admin user
3. If you prefer, you can also create a normal user first and promote them later via POST `/admin/make-admin`
4. Login and you will see the Admin shield icon in the sidebar if your account is an admin

## All Routes
| URL | What |
|---|---|
| /login | Login page |
| /register | Register page |
| /chat | Main AI chat |
| /admin | Admin dashboard |
| /verify-email?token=... | Email verification |
