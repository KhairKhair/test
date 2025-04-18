from fastapi import APIRouter, Request, HTTPException
from core.config import MODULES, PERMISSION_LEVELS
from core.security import get_current_user
from db.database import SQLiteDatabase

router = APIRouter()

# Initialize the database
db = SQLiteDatabase()

@router.get("/options")
async def permissions_options():
    return {"modules": MODULES, "levels": PERMISSION_LEVELS}

@router.post("/{target_username}/permissions")
async def update_permissions(target_username: str, request: Request):
    current = get_current_user(request)
    if current["username"] != "admin":
        raise HTTPException(403, "Admin access required")
    
    target_user = db.get_user(target_username)
    if not target_user:
        raise HTTPException(404, "User not found")
    
    data = await request.json()
    for module, level in data.items():
        if module not in MODULES or level not in PERMISSION_LEVELS:
            raise HTTPException(400, f"Invalid setting: {module}->{level}")
    
    success = db.update_user_permissions(target_username, data)
    if not success:
        raise HTTPException(500, "Failed to update permissions")
    
    return {"username": target_username, "permissions": data}