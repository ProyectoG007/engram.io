"""
============================================
CAPA 9: RAG PIPELINE + INDEXER SERVICE
Pinecone + Together AI
============================================
"""

import asyncio
import os
import uuid
from typing import Any, Dict, List, Optional

from pinecone import Pinecone
from together import Together

from app.services.embeddings import EmbeddingService

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "bh-saas-rag")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
DEFAULT_MODEL = "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo"


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Divide texto en chunks con solapamiento."""
    if len(text) <= size:
        return [text]
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


class RAGPipeline:
    """Pipeline de Recuperación-Aumentada-Generación."""

    def __init__(self, api_key: str):
        self.together = Together(api_key=api_key)
        self.embedding_service = EmbeddingService(api_key)
        self._pinecone_index = None

    def _get_index(self):
        if self._pinecone_index is None and PINECONE_API_KEY:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            self._pinecone_index = pc.Index(PINECONE_INDEX_NAME)
        return self._pinecone_index

    async def query(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, str]] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ejecuta una consulta RAG completa: recuperar → generar."""
        # 1. Embed la consulta
        query_embedding = await self.embedding_service.embed_single(query)

        # 2. Recuperar contexto desde Pinecone
        sources: List[Dict[str, Any]] = []
        index = self._get_index()
        if index:
            loop = asyncio.get_event_loop()
            kwargs: Dict[str, Any] = {
                "vector": query_embedding,
                "top_k": top_k,
                "include_metadata": True,
            }
            if filters:
                kwargs["filter"] = filters
            results = await loop.run_in_executor(None, lambda: index.query(**kwargs))
            sources = [
                {
                    "id": match.id,
                    "score": match.score,
                    "content": match.metadata.get("content", "") if match.metadata else "",
                    "metadata": match.metadata or {},
                }
                for match in results.matches
            ]

        # 3. Construir prompt con contexto
        context = "\n\n".join(s["content"] for s in sources if s["content"])
        base_system = system_prompt or (
            "Eres un asistente inteligente. Responde usando el contexto proporcionado "
            "cuando sea relevante y de forma clara y precisa."
        )
        messages = [
            {
                "role": "system",
                "content": f"{base_system}\n\nContexto:\n{context}" if context else base_system,
            },
            {"role": "user", "content": query},
        ]

        # 4. Generar respuesta con Together AI
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.together.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                max_tokens=1024,
            ),
        )

        answer = response.choices[0].message.content or ""
        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        }

        return {
            "answer": answer,
            "sources": sources,
            "model": DEFAULT_MODEL,
            "usage": usage,
        }


class IndexerService:
    """Servicio de indexación de documentos en Pinecone."""

    BATCH_SIZE = 100

    def __init__(self, api_key: str):
        self.embedding_service = EmbeddingService(api_key)
        self._pinecone_index = None

    def _get_index(self):
        if self._pinecone_index is None and PINECONE_API_KEY:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            self._pinecone_index = pc.Index(PINECONE_INDEX_NAME)
        return self._pinecone_index

    async def index_documents(
        self,
        documents: List[Dict[str, Any]],
        user_id: str,
    ) -> Dict[str, Any]:
        """Indexa documentos: chunkear → embedear → upsert en Pinecone."""
        all_chunks: List[Dict[str, Any]] = []

        for doc in documents:
            content = doc.get("content", "")
            metadata = dict(doc.get("metadata") or {})
            metadata["user_id"] = user_id
            for i, chunk in enumerate(_chunk_text(content)):
                all_chunks.append(
                    {
                        "id": f"{user_id}-{uuid.uuid4().hex}",
                        "content": chunk,
                        "metadata": {**metadata, "chunk_index": i},
                    }
                )

        if not all_chunks:
            return {"indexed": 0, "chunks": 0}

        # Generar embeddings en lote
        texts = [c["content"] for c in all_chunks]
        embeddings = await self.embedding_service.embed(texts)

        vectors = [
            {
                "id": chunk["id"],
                "values": embedding,
                "metadata": {**chunk["metadata"], "content": chunk["content"]},
            }
            for chunk, embedding in zip(all_chunks, embeddings)
        ]

        # Upsert en lotes
        index = self._get_index()
        if index:
            loop = asyncio.get_event_loop()
            for i in range(0, len(vectors), self.BATCH_SIZE):
                batch = vectors[i : i + self.BATCH_SIZE]
                await loop.run_in_executor(None, lambda b=batch: index.upsert(vectors=b))

        return {"indexed": len(documents), "chunks": len(all_chunks)}
