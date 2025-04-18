from fastapi import FastAPI
from routers import api_router
from middleware import add_cors_middleware

app = FastAPI()

add_cors_middleware(app)

app.include_router(api_router)
