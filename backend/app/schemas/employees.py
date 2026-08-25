from pydantic import BaseModel, ConfigDict


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str
    mission: str
    avatar: str
    skills: list[str]
    status: str
    created_at: str
