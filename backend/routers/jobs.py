import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from celery_app import celery_app
from database import get_db
from models import Job
from schemas import JobOut

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = "/app/uploads"


def _stream_to_disk(src, dest_path: str):
    with open(dest_path, "wb") as dst:
        shutil.copyfileobj(src, dst)


@router.post("/upload", response_model=list[JobOut])
async def upload_images(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    saved = []
    for file in files:
        extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        await run_in_threadpool(_stream_to_disk, file.file, file_path)
        saved.append((file.filename, unique_filename))

    jobs = [
        Job(original_filename=original, stored_filename=stored, status="pending")
        for original, stored in saved
    ]
    db.add_all(jobs)
    await db.commit()

    for job in jobs:
        celery_app.send_task("tasks.thumbnail_tasks.generate_thumbnail", args=[job.id])

    return jobs

    return jobs


@router.get("", response_model=list[JobOut])
async def get_jobs(
    ids: list[int] = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id.in_(ids)))
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobOut)
async def get_job_status(job_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
    return job