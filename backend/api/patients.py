from fastapi import APIRouter, Request, HTTPException
from db.database import SQLiteDatabase
from core.security import get_current_user

router = APIRouter()

# Initialize the database
db = SQLiteDatabase()

@router.get("/")
async def get_patients(request: Request):
    get_current_user(request)
    summary = db.list_patients_summary()
    return {"patients": summary}

@router.get("/{patient_id}")
async def get_patient_detail(patient_id: int, request: Request):
    get_current_user(request)
    patient = db.get_patient(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient

@router.post("/new")
async def create_patient(request: Request):
    get_current_user(request)
    data = await request.json()
    new_patient = db.create_patient(data)
    return new_patient

@router.post("/{patient_id}")
async def update_patient(patient_id: int, request: Request):
    get_current_user(request)
    data = await request.json()
    updated_patient = db.update_patient(patient_id, data)
    if not updated_patient:
        raise HTTPException(404, "Patient not found")
    return updated_patient