import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Job

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = "/app/uploads"

@router.post("/upload")
async def upload_images(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    created_jobs = []

    for file in files:
        extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        job = Job(filename=file.filename, status="pending")
        db.add(job)
        await db.commit()
        await db.refresh(job)

        created_jobs.append({"job_id": job.id, "filename": file.filename})

    return created_jobs