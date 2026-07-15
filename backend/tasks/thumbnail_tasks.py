import os
from PIL import Image
from celery_app import celery_app
from database_sync import SyncSessionLocal
from models import Job

UPLOAD_DIR = "/app/uploads"
THUMBNAIL_DIR = "/app/thumbnails"

THUMBNAIL_LONG_EDGE = 480

@celery_app.task
def generate_thumbnail(job_id: int):
    with SyncSessionLocal() as db:
        job = db.get(Job, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        input_path = os.path.join(UPLOAD_DIR, job.stored_filename)
        thumb_filename = f"{os.path.splitext(job.stored_filename)[0]}_thumb.webp"
        thumb_path = os.path.join(THUMBNAIL_DIR, thumb_filename)

        with Image.open(input_path) as img:
            img.draft("RGB", (THUMBNAIL_LONG_EDGE, THUMBNAIL_LONG_EDGE))

            img = img.convert("RGB")
            img.thumbnail((THUMBNAIL_LONG_EDGE, THUMBNAIL_LONG_EDGE))
            img.save(thumb_path, "WEBP", quality=70)

        job.thumbnail_filename = thumb_filename
        db.commit()