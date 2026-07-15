from datetime import datetime
from pydantic import BaseModel


class JobOut(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    status: str
    output_filename: str | None
    thumbnail_filename: str | None
    width: int | None
    height: int | None
    created_at: datetime

    model_config = {"from_attributes": True}