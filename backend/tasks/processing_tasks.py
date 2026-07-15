import os
import cv2
import numpy as np
from PIL import Image
from celery_app import celery_app
from database_sync import SyncSessionLocal
from models import Job

OUTPUT_DIR = "/app/outputs"
MODEL_PATH = "/app/models/face_detection_yunet_2026may.onnx"

_face_detector = cv2.FaceDetectorYN_create(MODEL_PATH, "", (0, 0), score_threshold=0.6)


@celery_app.task
def process_image(job_id: int):
    with SyncSessionLocal() as db:
        job = db.get(Job, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        input_path = os.path.join("/app/uploads", job.stored_filename)
        output_filename = f"{os.path.splitext(job.stored_filename)[0]}.webp"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        try:
            with Image.open(input_path) as img:
                img = img.convert("RGB")
                bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

                _face_detector.setInputSize((img.width, img.height))
                _, faces = _face_detector.detect(bgr)

                x, y, w, h = faces[0][:4].astype(int)
                cropped = img.crop((x, y, x + w, y + h))
                cropped.save(output_path, "WEBP", quality=85)
        except Exception:
            job.status = "failed"
            db.commit()
            raise

        job.status = "completed"
        job.output_filename = output_filename
        db.commit()
        return {
            "job_id": job_id,
            "output_filename": output_filename,
            "status": job.status,
        }