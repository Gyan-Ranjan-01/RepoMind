from datetime import datetime, timezone
from fastapi import APIRouter
from database import repos_col
import os

router = APIRouter()

@router.get("/")
def root():
    return {"app": "RepoMind API", "version": "1.0.0", 'Visit': os.environ.get("FRONTEND_URL")}

@router.get("/health")
def health():
    from config import START_TIME
    return {
        "status": "healthy",
        "uptime": str(datetime.now(timezone.utc) - START_TIME),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/repos")
def list_repos():
    repos = list(repos_col.find(
        {},
        {"_id": 0, "collection": 1, "repo_url": 1, "chunk_count": 1}
    ))
    return {"repos": repos}