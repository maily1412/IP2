import os
from collections.abc import Iterator
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

# Standard: backend/inventar.db, unabhängig vom Ordner, aus dem gestartet wird
STANDARD_DB = Path(__file__).resolve().parent.parent / "inventar.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{STANDARD_DB}")

# check_same_thread gibt es nur bei SQLite, Postgres würde daran scheitern
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def init_db() -> None:
    # Für das MVP ohne Alembic: fehlende Tabellen beim Start anlegen
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
