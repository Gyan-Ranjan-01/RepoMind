import time, os
from qdrant_client.models import PointStruct, VectorParams, Distance
from langchain_qdrant import QdrantVectorStore
from database import qdrant_client, embedding_engine, groq_llm, groq_fast
from config import BATCH_SIZE, INTENT_SYSTEM, IF_IS_INTENT

def embed_and_store(chunks: list, collection: str):
    if qdrant_client.collection_exists(collection):
        return QdrantVectorStore.from_existing_collection(
            embedding=embedding_engine, url=os.environ['QDRANT_URL'],
            api_key=os.environ['QDRANT_API_KEY'], collection_name=collection,
            content_payload_key='page_content')
    texts = [doc.page_content for doc in chunks]
    metadata = [doc.metadata for doc in chunks]
    vectors = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        vectors.extend(embedding_engine.embed_documents(batch))
        if i + BATCH_SIZE < len(texts):
            time.sleep(60)
    qdrant_client.create_collection(
        collection_name=collection,
        vectors_config=VectorParams(size=len(vectors[0]), distance=Distance.COSINE))
    points = [PointStruct(id=i, vector=vectors[i], payload={'page_content': texts[i], **metadata[i]})
              for i in range(len(texts))]
    qdrant_client.upsert(collection_name=collection, points=points)
    return QdrantVectorStore.from_existing_collection(
        embedding=embedding_engine, url=os.environ['QDRANT_URL'],
        api_key=os.environ['QDRANT_API_KEY'], collection_name=collection,
        content_payload_key='page_content')

def is_conversational(question: str):
    response = groq_fast.invoke([
        {'role': 'system', 'content': INTENT_SYSTEM},
        {'role': 'user', 'content': question}
    ])
    return response.content.strip().lower() == 'chat'

def generate_queries(question: str):
    response = groq_llm.invoke(f"""Given a user question about a code repository, generate up to 10 diverse semantic search queries.
 
Each query should target a different retrieval angle:
- implementation details
- execution flow
- related classes/functions
- configuration
- dependencies/imports
- utility/helper functions
- error handling
- API routes
- data flow
- architectural components
 
Queries must be concise, technical, and optimized for vector similarity retrieval.
Avoid redundant paraphrases.
Return only one query per line, nothing else.
 
Query: {question}""")
    return [q.strip() for q in response.content.strip().split("\n") if q.strip()]

def retrieve_docs(queries: list, vector_db):
    seen, docs = set(), []
    for q in queries:
        for doc in vector_db.similarity_search(q, k=10):
            if doc.page_content not in seen:
                docs.append(doc)
                seen.add(doc.page_content)
    return docs

def build_context(docs: list):
    context = ""
    for i, doc in enumerate(docs):
        source = doc.metadata.get("source_file", "Unknown")
        context += f"\n-- Snippet {i+1} | {source} --\n{doc.page_content}\n"
    return context