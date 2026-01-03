from pydantic import BaseModel
from typing import Optional
from datetime import date

class ShootingResponse(BaseModel):
    id: int
    name: str
    date: Optional[date]
    race: str
    state: str
    armed_with: str

    class Config:
        from_attributes = True

class StatResponse(BaseModel):
    race: str
    percentage: float
    count: int