from pydantic import BaseModel
from schemas.permission import PermissionsSchema

class User(BaseModel):
    username: str
    permissions: PermissionsSchema
