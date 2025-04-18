from fastapi import Request, HTTPException
from core.config import COOKIE_NAME
from db.database import SQLiteDatabase

# Initialize the database
db = SQLiteDatabase()

def get_current_user(request: Request):
    username = request.cookies.get(COOKIE_NAME)
    if not username:
        raise HTTPException(401, "Not authenticated")
    
    user = db.get_user(username)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    return user