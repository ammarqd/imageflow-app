from contextlib import asynccontextmanager

from fastapi import FastAPI
from database import engine, Base
from routers import jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(jobs.router)


@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI inside Docker!"}