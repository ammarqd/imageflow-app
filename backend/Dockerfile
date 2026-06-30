FROM python:3.14-slim AS base
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
ENV PATH="/app/.venv/bin:$PATH"
COPY pyproject.toml .

FROM base AS api
RUN uv sync --group api --no-install-project
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS worker
RUN uv sync --group worker --no-install-project
COPY . .
CMD ["celery", "-A", "celery_app", "worker"]