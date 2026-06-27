from pydantic import BaseModel

class IngestRequest(BaseModel):
    repo_url: str

class ChatRequest(BaseModel):
    repo_url: str
    question: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str