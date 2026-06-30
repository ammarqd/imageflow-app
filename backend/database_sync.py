import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from base import Base

SYNC_DATABASE_URL = os.environ["DATABASE_URL"].replace(
    "postgresql+asyncpg", "postgresql+psycopg2"
)

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    pool_size=8,
    max_overflow=4,
)

SyncSessionLocal = sessionmaker(sync_engine)