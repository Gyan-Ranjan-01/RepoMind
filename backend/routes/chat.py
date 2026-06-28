import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from langchain_qdrant import QdrantVectorStore
from database import qdrant_client, embedding_engine, groq_llm
from models import ChatRequest
from helpers.github import collection_name_from_url
from helpers.rag import is_conversational, generate_queries, retrieve_docs, build_context
from helpers.auth import get_current_user, get_usage, increment_usage
from config import USER_DAILY_CHAT, IF_IS_INTENT

router = APIRouter()

@router.post("/chat")
def chat(req: ChatRequest, user=Depends(get_current_user)):
    repo_url = req.repo_url.strip()
    question = req.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question can't be empty")

    print(question)
    collection = collection_name_from_url(repo_url)
    if not qdrant_client.collection_exists(collection):
        raise HTTPException(status_code=404, detail="Repo not indexed yet. Run /ingest first.")

    if user:
        usage = get_usage(user["_id"])
        if usage.get("chat_count", 0) >= USER_DAILY_CHAT:
            raise HTTPException(status_code=429, detail="Daily chat limit reached (10/day). Come back tomorrow.")

    if is_conversational(question):
        def simple_stream():
            for chunk in groq_llm.stream(IF_IS_INTENT + question):
                if chunk.content:
                    yield chunk.content
        return StreamingResponse(simple_stream(), media_type='text/plain')

    vector_db = QdrantVectorStore.from_existing_collection(
        embedding=embedding_engine,
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
        collection_name=collection,
        content_payload_key="page_content",
    )

    queries = generate_queries(question)
    docs = retrieve_docs(queries, vector_db)
    context = build_context(docs)

    prompt = f'''You are RepoMind, an expert Senior Software Architect and Codebase Analyst.

        Your task is to analyze a repository strictly from the retrieved code snippets provided in the context.

        CRITICAL RULES:

        1. Treat the retrieved context as the ONLY source of truth.
        2. Never assume, invent, infer, or speculate about code that is not visible.
        3. If the answer cannot be determined from the retrieved context, respond exactly:
        "Not visible in retrieved context."
        4. Do not suggest files, modules, APIs, services, classes, functions, or architectures that are not explicitly present.
        5. Distinguish clearly between:

        * Explicit facts (directly visible in code)
        * Reasonable observations (derived from visible code structure)
        6. Never present observations as facts.

        CITATION RULES:

        * Every technical claim must include the source file name immediately after the statement.

        * Example:

        * User authentication uses JWT tokens. (auth.py)
        * User records are stored in MongoDB. (database.py)

        * If multiple files support a statement:

        * Authentication middleware validates JWTs. (auth.py, middleware.py)

        ANSWERING STYLE:

        * Be direct, concise, and technically precise.
        * Prefer bullet points.
        * For architecture questions, explain only components visible in the retrieved context.
        * For implementation questions, describe the actual code behavior.
        * For repository summaries, organize answers into:

        * Purpose
        * Technologies
        * Key Components
        * Data Flow
        * External Services
        * Notable Patterns

        REPOSITORY-WIDE QUESTIONS:

        When asked about the architecture, workflow, authentication, database, APIs, deployment, or system design:

        * First identify all relevant files from the retrieved context.
        * Build the explanation only from those files.
        * If part of the flow is missing, explicitly state:
        "This portion of the workflow is not visible in retrieved context."

        CODE EXPLANATION RULES:

        When explaining a function, class, or module:

        * State its purpose.
        * Explain inputs and outputs if visible.
        * Explain important logic.
        * Mention dependencies if visible.
        * Cite source files.

        OUTPUT QUALITY:

        * Prioritize correctness over completeness.
        * Missing information is preferable to speculation.
        * Never hallucinate repository details.

        REPOSITORY CONTEXT:

        {context}\n
    '''

    final_prompt = prompt + question

    def stream_response():
        for chunk in groq_llm.stream(final_prompt):
            if chunk.content:
                yield chunk.content

    if user:
        increment_usage(user["_id"], "chat_count")
    return StreamingResponse(stream_response(), media_type="text/plain")