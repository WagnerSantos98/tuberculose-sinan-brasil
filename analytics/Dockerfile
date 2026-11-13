# syntax=docker/dockerfile:1
# Imagem do analytics: pipeline (download + exportação dos JSON), notebook e testes.
FROM python:3.13-slim AS builder
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

FROM python:3.13-slim
ARG UID=1000
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    MPLBACKEND=Agg \
    TB_DADOS_BRUTOS=/app/data/raw \
    TB_DADOS_PROCESSADOS=/app/data/processed \
    TB_SAIDA_PAINEL=/app/output
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* && rm -rf /wheels

WORKDIR /app
COPY src ./src
COPY tests ./tests
COPY notebooks ./notebooks
RUN useradd --create-home --uid ${UID} analista \
 && mkdir -p data/raw data/processed output figuras \
 && chown -R analista:analista /app
USER analista

ENTRYPOINT [ "python", "-m", "tb_analytics" ]
CMD ["pipeline"]