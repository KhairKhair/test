from pydantic import BaseModel
from typing import Literal
from core.config import MODULES, PERMISSION_LEVELS

class PermissionsSchema(BaseModel):
    patient_mgmt: Literal["None", "View", "Edit"]
    user_mgmt: Literal["None", "View", "Edit"]
    pharmacy: Literal["None", "View", "Edit"]
