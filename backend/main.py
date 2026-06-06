from typing import List

from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI inside Docker!"}

@app.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    return {
        "filename": files.filename,
        "content_type": files.content_type
    }