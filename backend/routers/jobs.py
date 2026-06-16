import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Job
from schemas import JobOut
from tasks import process_image

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = "/app/uploads"

def save_file_sync(file_contents: bytes, destination: str):
    with open(destination, "wb") as f:
        f.write(file_contents)

@router.post("/upload", response_model=list[JobOut])
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
        await run_in_threadpool(save_file_sync, contents, file_path)

        job = Job(
            original_filename=file.filename,
            stored_filename=unique_filename,
            status="pending"
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        process_image.delay(job.id)

        created_jobs.append(job)

    return created_jobs

@router.get("/{job_id}", response_model=JobOut)
async def get_job_status(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    
    return job

@router.get("/{job_id}/download")
async def download_job_output(
    job_id: int,
    db: AsyncSession = Depends(get_db)
):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found"
        )
    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is not completed, current status: {job.status}"
        )
    return FileResponse(
        path=job.output_path,
        media_type="image/webp",
        filename=f"{os.path.splitext(job.original_filename)[0]}.webp"
    )