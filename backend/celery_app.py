import os

from celery import Celery

REDIS_URL = os.environ["REDIS_URL"]

celery_app = Celery(
    "imageflow",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.processing_tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)