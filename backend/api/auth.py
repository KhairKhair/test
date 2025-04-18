from fastapi import APIRouter, Form, Request, Response, HTTPException
from core.config import COOKIE_NAME
from db.database import SQLiteDatabase

router = APIRouter()

# Initialize the database
db = SQLiteDatabase()

@router.post("/login")
async def login(response: Response, username: str = Form(...), password: str = Form(...), remember: bool = Form(False)):
    user = db.get_user(username)
    if not user or password != user["password"]:
        raise HTTPException(401, "Invalid credentials")
    max_age = 2592000 if remember else 3600
    response.set_cookie(COOKIE_NAME, username, max_age=max_age, httponly=True, samesite="none", secure=True)
    return {"message": "Login successful"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, samesite="none", secure=True)
    return {"message": "Logged out"}

@router.get("/me")
async def me(request: Request):
    username = request.cookies.get(COOKIE_NAME)
    if not username:
        raise HTTPException(401, "Not authenticated")
    
    user = db.get_user(username)
    if not user:
        raise HTTPException(401, "Not authenticated")
    
    return {"username": user["username"], "permissions": user["permissions"]}