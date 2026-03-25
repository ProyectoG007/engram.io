# ============================================
# CAPA 4 + 9: RAG API SERVICE (FastAPI)
# Python FastAPI Service
# ============================================

FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY app/ ./app/
COPY main.py .

# Puerto
EXPOSE 8000

# Iniciar servicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
