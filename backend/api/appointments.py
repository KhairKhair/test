from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List

router = APIRouter()

# Mock database
appointments = [
    {
        "id": 1,
        "patient_name": "Alice Johnson",
        "date": "2023-10-01",
        "time": "10:00",
        "reason": "Routine Checkup",
        "status": "Scheduled"
    },
    {
        "id": 2,
        "patient_name": "Bob Smith",
        "date": "2023-10-02",
        "time": "11:00",
        "reason": "Follow-up",
        "status": "Completed"
    },
    {
        "id": 3,
        "patient_name": "Charlie Davis",
        "date": "2023-10-03",
        "time": "09:30",
        "reason": "Consultation",
        "status": "Missed"
    }
]

# Pydantic model for edit form
class AppointmentUpdate(BaseModel):
    date: str
    time: str
    reason: str
    status: str  # "Scheduled", "Completed", etc.

@router.get("/")
async def get_appointments():
    """
    Get all appointments.
    """
    return JSONResponse(content={"appointments": appointments})


@router.post("/new")
async def create_appointment(appt: AppointmentUpdate):
    """
    Create a new appointment (mock logic).
    """
    new_id = max(a["id"] for a in appointments) + 1
    new_appt = {
        "id": new_id,
        "patient_name": f"Patient {new_id}",  # Replace with real lookup in real DB
        "date": appt.date,
        "time": appt.time,
        "reason": appt.reason,
        "status": appt.status
    }
    appointments.append(new_appt)
    return {"appointment": new_appt}


@router.get("/{appointment_id}")
async def get_appointment_by_id(appointment_id: int):
    """
    Get a specific appointment by ID.
    """
    for appt in appointments:
        if appt["id"] == appointment_id:
            return JSONResponse(content={"appointment": appt})
    raise HTTPException(status_code=404, detail="Appointment not found")


@router.post("/{appointment_id}")
async def update_appointment(appointment_id: int, updated: AppointmentUpdate):
    """
    Update an appointment.
    """
    for appt in appointments:
        if appt["id"] == appointment_id:
            appt["date"] = updated.date
            appt["time"] = updated.time
            appt["reason"] = updated.reason
            appt["status"] = updated.status
            return JSONResponse(content=appt)

    raise HTTPException(status_code=404, detail="Appointment not found")


