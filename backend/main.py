from pathlib import Path
import os
import sqlite3
import tempfile
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
configured_db_path = os.getenv("BIRD_DATABASE_PATH")
if configured_db_path:
    DB_PATH = Path(configured_db_path)
elif os.getenv("VERCEL"):
    DB_PATH = Path(tempfile.gettempdir()) / "bird_scores.db"
else:
    DB_PATH = BASE_DIR / "bird_scores.db"

app = FastAPI(title="Bird Flight API", version="1.0.0")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_db():
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL CHECK(score >= 0),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


initialize_db()


class ScoreIn(BaseModel):
    player_name: str = Field(min_length=1, max_length=18)
    score: int = Field(ge=0, le=1000000)


class ScoreOut(BaseModel):
    id: int
    player_name: str
    score: int
    created_at: str


@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Bird Flight"}


@app.get("/api/scores", response_model=List[ScoreOut])
def get_scores():
    with connect_db() as db:
        rows = db.execute(
            "SELECT id, player_name, score, created_at FROM scores "
            "ORDER BY score DESC, id ASC LIMIT 10"
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/scores", response_model=ScoreOut, status_code=201)
def add_score(payload: ScoreIn):
    name = payload.player_name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Player name cannot be blank.")
    with connect_db() as db:
        cursor = db.execute(
            "INSERT INTO scores (player_name, score) VALUES (?, ?)",
            (name, payload.score)
        )
        row = db.execute(
            "SELECT id, player_name, score, created_at FROM scores WHERE id = ?",
            (cursor.lastrowid,)
        ).fetchone()
    return dict(row)
