from datetime import datetime
from pydantic import BaseModel


class JobOut(BaseModel):
    id: int
    original_filename: str
    status: str
    output_path: str | None
    created_at: datetime

    model_config = {"from_attributes": True}