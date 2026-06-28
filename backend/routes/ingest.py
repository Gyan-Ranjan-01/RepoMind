import os, shutil, subprocess
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from database import qdrant_client, repos_col
from models import IngestRequest
from helpers.github import collection_name_from_url, clone_repo, path_and_filter_repo, build_chunk
from helpers.rag import embed_and_store
from helpers.auth import get_current_user, get_usage, increment_usage
from config import USER_DAILY_INGEST

router = APIRouter()

@router.post("/ingest")
def ingest(req: IngestRequest, user=Depends(get_current_user)):
    repo_url = req.repo_url.strip()
    if not repo_url.startswith('https://github.com/'):
        raise HTTPException(status_code=400, detail='Only Github urls are supported.')

    collection = collection_name_from_url(repo_url)

    if qdrant_client.collection_exists(collection):
        if not repos_col.find_one({"collection": collection}):
            clone_repo(repo_url, target_dir)
            files = path_and_filter_repo(target_dir)
            chunks = build_chunk(files)
            repos_col.insert_one({
                "collection": collection,
                "repo_url": repo_url,
                "chunk_count": len(chunks),
                "indexed_at": datetime.now(timezone.utc)
            })
        return {'status': 'cached', 'collection': collection, 'message': 'Repo already indexed. Ready to chat'}

    if not user:
        raise HTTPException(
            status_code=401,
            detail="This repository hasn't been indexed yet. Please sign up to index new codebases!"
        )

    usage = get_usage(user["_id"])
    if usage.get("ingest_count", 0) >= USER_DAILY_INGEST:
        raise HTTPException(status_code=429, detail="Daily ingest limit reached (1/day). Come back tomorrow.")

    target_dir = f'/tmp/rag_repo_{collection}'
    try:
        clone_repo(repo_url, target_dir)
        files = path_and_filter_repo(target_dir)
        if not files:
            raise HTTPException(status_code=422, detail="No supported source files found in this repo")
        chunks = build_chunk(files)
        if len(chunks) > 300:
            raise HTTPException(status_code=400, detail='The Repo is too large, try with a smaller repo.')
        embed_and_store(chunks, collection)
        repos_col.update_one(
            {"collection": collection},
            {"$set": {
                "collection": collection,
                "repo_url": repo_url,
                "chunk_count": len(chunks),
                "indexed_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        increment_usage(user["_id"], "ingest_count")
        return {
            'status': 'indexed',
            'collection': collection,
            'chunk_count': len(chunks),
            'file_count': len(files),
            'message': f'Indexed {len(files)} files into {len(chunks)} chunks. Ready to chat'
        }
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=400, detail='Failed to clone the url. Check the url is public.')
    finally:
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir, ignore_errors=True)