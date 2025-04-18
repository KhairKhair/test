from fastapi import APIRouter, Request, HTTPException
from core.security import get_current_user
from db.database import SQLiteDatabase

router = APIRouter()

# Initialize the database
db = SQLiteDatabase()

@router.get("/")
async def list_users(request: Request):
    current = get_current_user(request)
    if current["username"] != "admin":
        raise HTTPException(403, "Admin access required")
    
    users = db.list_users()
    return {"users": [{"username": user["username"], "permissions": user["permissions"]} for user in users]}
