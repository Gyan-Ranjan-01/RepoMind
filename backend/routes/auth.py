import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from database import users_col
from models import RegisterRequest, LoginRequest
from helpers.auth import (
    get_current_user, get_usage, hash_password, verify_password,
    create_token, increment_usage
)
from config import (
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    FRONTEND_URL, BACKEND_URL,
    USER_DAILY_CHAT, USER_DAILY_INGEST
)

router = APIRouter()

@router.post('/auth/register')
def register(req: RegisterRequest):
    if users_col.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")
    users_col.insert_one({
        "_id": req.email,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "provider": "email",
        "created_at": datetime.now(timezone.utc)
    })
    token = create_token(req.email)
    return {'token': token, 'email': req.email}

@router.post('/auth/login')
def login(req: LoginRequest):
    user = users_col.find_one({'email': req.email})
    if not user or not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password.")
    token = create_token(user['_id'])
    return {'token': token, 'email': user['email']}

@router.get('/auth/me')
def me(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail='Not Authorized')
    usage = get_usage(user['_id'])
    return {
        "email": user["email"],
        "chat_count": usage.get("chat_count", 0),
        "ingest_count": usage.get("ingest_count", 0),
        "chat_limit": USER_DAILY_CHAT,
        "ingest_limit": USER_DAILY_INGEST,
    }

@router.get('/auth/google')
def google_login():
    params = (
        f'client_id={GOOGLE_CLIENT_ID}'
        f"&redirect_uri={BACKEND_URL}/auth/google/callback"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")

@router.get('/auth/google/callback')
async def google_callback(code: str):
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{BACKEND_URL}/auth/google/callback",
            "grant_type": "authorization_code",
        })
        token_data = token_res.json()
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        user_info = user_res.json()

    email = user_info['email']
    if not users_col.find_one({'_id': email}):
        users_col.insert_one({
            "_id": email,
            "email": email,
            "google_id": user_info["id"],
            "provider": "google",
            "created_at": datetime.now(timezone.utc)
        })
    token = create_token(email)
    return RedirectResponse(f"{FRONTEND_URL}/chat.html?token={token}")