# Bird Flight — Full-Stack Bird Game

A playable Flappy-Bird-style browser game with a FastAPI backend and SQLite leaderboard.

## Stack
- Frontend: HTML, CSS, JavaScript (Canvas)
- Backend: Python + FastAPI
- Database: SQLite
- API: `/api/health`, `/api/scores`, `/api/scores` (POST)

## Run on Windows (VS Code / PowerShell)
1. Install Python 3.10+.
2. Open this folder in VS Code.
3. In the terminal, create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn backend.main:app --reload
   ```

4. Open http://127.0.0.1:8000
5. API docs: http://127.0.0.1:8000/docs

If PowerShell blocks activation, use:
`.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
then
`.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload`

## Play
- Press Space, click, or tap to flap.
- Press Enter or click Restart after a collision.
- Enter a player name and submit your score to the leaderboard.

## Project structure
```text
bird_game_fullstack/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── game.js
├── requirements.txt
└── README.md
```

Scores are stored locally in `bird_scores.db`, created automatically at first launch.
