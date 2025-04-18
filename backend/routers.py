from fastapi import APIRouter
from api.auth import router as auth_router
from api.patients import router as patients_router
from api.users import router as users_router
from api.permissions import router as permissions_router
from api.dashboard import router as dashboard_router
from api.appointments import router as appointments_router  

api_router = APIRouter()

api_router.include_router(auth_router, prefix="", tags=["auth"])
api_router.include_router(patients_router, prefix="/patients", tags=["patients"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(permissions_router, prefix="/permissions", tags=["permissions"])
api_router.include_router(dashboard_router, prefix="", tags=["dashboard"])
api_router.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
