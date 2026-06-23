import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    _db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kryonix.db")
    DATABASE_URL = f"sqlite:///{_db_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, future=True)
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
