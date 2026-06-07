import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from database import engine, Base
import models

@asynccontextmanager
async def lifespan(app : FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI inside Docker!"}

@app.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    return [
        {"filename": file.filename, "content_type": file.content_type}
        for file in files
    ]