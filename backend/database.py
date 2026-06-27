import os
from pymongo import MongoClient
from qdrant_client import QdrantClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

mongo_client = MongoClient(os.environ["MONGODB_URL"])
db = mongo_client["repomind"]
users_col = db["users"]
usage_col = db["usage"]
repos_col = db["repos"]

qdrant_client = QdrantClient(url=os.environ['QDRANT_URL'], api_key=os.environ['QDRANT_API_KEY'])

embedding_engine = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2-preview", batch_size=100)
groq_llm = ChatGroq(model='llama-3.3-70b-versatile', temperature=0.2)
groq_fast = ChatGroq(model='llama-3.3-70b-versatile', temperature=0.1)