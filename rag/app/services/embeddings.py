"""
============================================
CAPA 9: EMBEDDING SERVICE
Together AI - Generación de embeddings
============================================
"""

import asyncio
import os
from typing import List

from together import Together


class EmbeddingService:
    """Servicio de embeddings usando Together AI."""

    DEFAULT_MODEL = "intfloat/multilingual-e5-large-instruct"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = Together(api_key=api_key)
        self.model = self.DEFAULT_MODEL

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Genera embeddings para una lista de textos."""
        if not texts:
            return []
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.embeddings.create(model=self.model, input=texts),
        )
        return [item.embedding for item in response.data]

    async def embed_single(self, text: str) -> List[float]:
        """Genera embedding para un único texto."""
        results = await self.embed([text])
        return results[0]
