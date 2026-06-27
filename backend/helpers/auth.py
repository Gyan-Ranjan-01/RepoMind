from datetime import datetime, date, timedelta, timezone
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import users_col, usage_col
from config import JWT_SECRET, JWT_ALGO, JWT_EXPIRE_DAYS

bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str):
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload.get('sub')
    except JWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if not user_id:
        return None
    return users_col.find_one({'_id': user_id})

def get_today():
    return date.today().isoformat()

def get_usage(user_id: str):
    today = get_today()
    record = usage_col.find_one({"user_id": user_id, "date": today})
    return record if record else {"chat_count": 0, "ingest_count": 0}

def increment_usage(user_id: str, field: str):
    usage_col.update_one(
        {"user_id": user_id, "date": get_today()},
        {"$inc": {field: 1}}, upsert=True)