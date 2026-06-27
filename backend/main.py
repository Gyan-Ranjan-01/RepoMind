import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import REQUIRED_ENV, FRONTEND_URL
from database import mongo_client, qdrant_client
from routes import ingest, chat, auth, repos

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting RepoMind...")
    for env in REQUIRED_ENV:
        if not os.getenv(env):
            raise RuntimeError(f"Missing environment variable: {env}")
    try:
        mongo_client.admin.command("ping")
        print("MongoDB Connected")
    except Exception as e:
        raise RuntimeError(f"MongoDB Error: {e}")
    try:
        qdrant_client.get_collections()
        print("Qdrant Connected")
    except Exception as e:
        raise RuntimeError(f"Qdrant Error: {e}")
    print("RepoMind Ready")
    yield
    print("RepoMind Stopped")

app = FastAPI(
    title="RepoMind API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=['*'],
    allow_headers=['*'],
    allow_credentials=True
)

app.include_router(ingest.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(repos.router)