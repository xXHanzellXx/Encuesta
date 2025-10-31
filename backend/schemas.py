from pydantic import BaseModel
from typing import List, Dict

class User(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class QuizResult(BaseModel):
    answers: Dict[str, str]
    softSkills: List[str]
