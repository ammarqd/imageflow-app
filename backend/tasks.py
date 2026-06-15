import os
from celery_app import celery_app
from database import SyncSessionLocal
from models import Job
from PIL import Image

OUTPUT_DIR = "/app/outputs"

@celery_app.task
def process_image(job_id: int):
    with SyncSessionLocal() as db:
        job = db.get(Job, job_id)
        job.status = "processing"
        db.commit()

        input_path = os.path.join("/app/uploads", job.stored_filename)
        stem = os.path.splitext(job.stored_filename)[0]
        output_path = os.path.join(OUTPUT_DIR, f"{stem}.webp")

        with Image.open(input_path) as img:
            img.save(output_path, "WEBP")

        job.status = "completed"
        job.output_path = output_path
        db.commit()