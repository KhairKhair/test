from pydantic import BaseModel
from typing import Optional

class Patient(BaseModel):
    id: int
    name: str
    date_of_birth: str
    gender: str
    contact: dict
    emergency_contact: dict
    insurance: str
    medical_history: list
    last_visit: str
    notes: Optional[str]
