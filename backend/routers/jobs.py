import asyncio
import os
import shutil
import uuid

import imagesize
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from celery_app import celery_app
from database import get_db
from models import Job
from schemas import JobOut

router = APIRouter(prefix="/jobs", tags=["jobs"])
UPLOAD_DIR = "/app/uploads"

UPLOAD_CONCURRENCY = 24
_upload_semaphore = asyncio.Semaphore(UPLOAD_CONCURRENCY)


def _stream_to_disk(src, dest_path: str) -> tuple[int, int]:
    with open(dest_path, "wb") as dst:
        shutil.copyfileobj(src, dst)
    return imagesize.get(dest_path)


async def _handle_one_upload(file: UploadFile) -> Job:
    extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    async with _upload_semaphore:
        width, height = await run_in_threadpool(_stream_to_disk, file.file, file_path)

    return Job(
        original_filename=file.filename,
        stored_filename=unique_filename,
        status="uploaded",
        width=width,
        height=height,
    )


@router.post("/upload", response_model=list[JobOut])
async def upload_images(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    jobs = await asyncio.gather(*(_handle_one_upload(f) for f in files))
    db.add_all(jobs)
    await db.commit()

    for job in jobs:
        celery_app.send_task("tasks.thumbnail_tasks.generate_thumbnail", args=[job.id])

    return jobs


@router.post("/run", response_model=list[JobOut])
async def run_jobs(
    ids: list[int] = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Job).where(Job.id.in_(ids), Job.status.in_(["uploaded", "failed"]))
    )
    jobs = result.scalars().all()
    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No runnable jobs for the given ids",
        )
    for job in jobs:
        job.status = "processing"
    await db.commit()
    for job in jobs:
        celery_app.send_task("tasks.processing_tasks.process_image", args=[job.id])
    return jobs


@router.get("", response_model=list[JobOut])
async def get_jobs(
    ids: list[int] = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id.in_(ids)))
    return result.scalars().all()


@router.get("/{job_id:int}", response_model=JobOut)
async def get_job_status(job_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
    return job