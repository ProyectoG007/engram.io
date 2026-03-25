"""
============================================
CAPA 4 + 9: RAG API SERVICE
FastAPI - Retrieval-Augmented Generation
============================================
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from contextlib import asynccontextmanager

from app.services.rag_pipeline import RAGPipeline, IndexerService
from app.services.embeddings import EmbeddingService

# ============================================
# CONFIGURACIÓN
# ============================================
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "bh-saas-rag")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")


# ============================================
# LIFESPAN
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting RAG API Service...")
    print(f"   - Together AI: {'✓' if TOGETHER_API_KEY else '✗'}")
    print(f"   - Pinecone: {'✓' if PINECONE_API_KEY else '✗'}")
    yield
    print("👋 Shutting down RAG API Service...")


# ============================================
# APP
# ============================================
app = FastAPI(
    title="B'H RAG API",
    description="Retrieval-Augmented Generation Service - Protocolo TITAN",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# MODELS
# ============================================
class QueryRequest(BaseModel):
    query: str
    top_k: int = 5
    filters: Optional[Dict[str, str]] = None
    system_prompt: Optional[str] = None


class IndexDocument(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None


class IndexRequest(BaseModel):
    documents: List[IndexDocument]
    user_id: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    model: str
    usage: Dict[str, int]


# ============================================
# INSTANCIAS DE SERVICIOS
# ============================================
rag_pipeline = RAGPipeline(TOGETHER_API_KEY) if TOGETHER_API_KEY else None
indexer_service = IndexerService(TOGETHER_API_KEY) if TOGETHER_API_KEY else None
embedding_service = EmbeddingService(TOGETHER_API_KEY) if TOGETHER_API_KEY else None


# ============================================
# ENDPOINTS
# ============================================
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "B'H RAG API", "version": "1.0.0", "layer": 9}


@app.get("/health")
async def health():
    """Health check detallado."""
    return {
        "status": "healthy",
        "services": {
            "together": bool(TOGETHER_API_KEY),
            "pinecone": bool(PINECONE_API_KEY),
            "rag_pipeline": rag_pipeline is not None,
            "indexer": indexer_service is not None,
        },
    }


@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Realiza una consulta RAG.

    Flujo:
    1. Recupera documentos relevantes (R)
    2. Genera respuesta con contexto (G)
    """
    if not rag_pipeline:
        raise HTTPException(status_code=500, detail="RAG pipeline no configurado")

    try:
        result = await rag_pipeline.query(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters,
            system_prompt=request.system_prompt,
        )

        return QueryResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/documents")
async def index_documents(request: IndexRequest):
    """Indexa documentos en la base vectorial."""
    if not indexer_service:
        raise HTTPException(status_code=500, detail="Indexer no configurado")

    try:
        documents = [
            {"content": d.content, "metadata": d.metadata} for d in request.documents
        ]

        result = await indexer_service.index_documents(
            documents=documents, user_id=request.user_id
        )

        return {"success": True, **result, "meta": {"layer": 9, "timestamp": "ISO"}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/file")
async def index_file(file: UploadFile = File(...), user_id: str = "default"):
    """Indexa un archivo subido."""
    if not indexer_service:
        raise HTTPException(status_code=500, detail="Indexer no configurado")

    try:
        content = await file.read()
        text = content.decode("utf-8")

        result = await indexer_service.index_documents(
            documents=[
                {
                    "content": text,
                    "metadata": {
                        "filename": file.filename,
                        "mime_type": file.content_type,
                    },
                }
            ],
            user_id=user_id,
        )

        return {"success": True, "filename": file.filename, **result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/embeddings/models")
async def get_embedding_models():
    """Lista modelos de embedding disponibles."""
    return {
        "models": [
            {"id": "intfloat/multilingual-e5-large-instruct", "dimensions": 1024}
        ]
    }


@app.get("/llm/models")
async def get_llm_models():
    """Lista modelos LLM disponibles."""
    return {
        "models": [
            {"id": "Qwen/Qwen2.5-7B-Instruct-Turbo", "parameters": "7B"},
            {"id": "meta-llama/Llama-3.1-70B-Instruct-Turbo", "parameters": "70B"},
            {"id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "parameters": "47B"},
        ]
    }


# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
