# ImageFlow

A distributed, asynchronous image processing pipeline built with FastAPI, Celery, Redis, PostgreSQL, React, and Docker.

## ✨ Features

* Batch image uploads with asynchronous processing via Celery and Redis
* WebP conversion using Pillow as a decoupled Celery worker task
* REST API for job status polling and processed image retrieval
* React dashboard with polling to track job states and render image gallery
* Containerised with Docker Compose orchestrating all services

## 🛠️ Tech Stack

* **Backend:** FastAPI, SQLAlchemy
* **Task Queue:** Celery, Redis
* **Database:** PostgreSQL
* **Image Processing:** Pillow
* **Frontend:** React, TypeScript
* **Infrastructure:** Docker, Docker Compose

## 🚀 Running Locally

Requires Docker and Docker Compose.

```bash
git clone https://github.com/ammarqd/imageflow-app.git
cd imageflow-app
docker compose up --build
```

## 📖 API

* `POST /jobs/upload` — Upload one or more images
* `GET /jobs/{id}` — Get job status
* `GET /jobs/{id}/download` — Download processed image
