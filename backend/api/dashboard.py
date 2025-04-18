from fastapi import APIRouter, Request, HTTPException
from core.security import get_current_user
from db.database import SQLiteDatabase

router = APIRouter()

# Initialize the database
db = SQLiteDatabase()

@router.get("/dashboard")
async def dashboard(request: Request):
    current_user = get_current_user(request)
    permissions = current_user["permissions"]

    # Fetch module metadata from the database
    modules = db.list_modules()  # Assume this method fetches module metadata from the database

    cards = []
    for module, permission in permissions.items():
        if permission != "None" and module in modules:
            cards.append({
                "id": module,
                "href": modules[module]["href"],
                "title": modules[module]["title"],
                "description": modules[module]["description"],
                "icon": modules[module]["icon"],
            })

    return {"cards": cards}