from fastapi import FastAPI, UploadFile, File
from typing import List

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI inside Docker!"}

@app.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    return [
        {"filename": file.filename, "content_type": file.content_type}
        for file in files
    ]