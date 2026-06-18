# ImageFlow

A distributed, asynchronous image processing pipeline built with FastAPI, Celery, Redis, PostgreSQL, React, and Docker.

## ✨ Features

* Batch image upload with asynchronous processing via Celery and Redis
* WebP conversion using Pillow with job lifecycle tracking (`pending → processing → completed → failed`)
* REST API for job status polling and processed image retrieval
* Containerised with Docker Compose orchestrating all services
* React dashboard (in progress)

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
