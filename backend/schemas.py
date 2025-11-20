from pydantic import BaseModel
from typing import List, Dict, Optional

# Modelo para una sola habilidad con su puntaje
class SoftSkillScore(BaseModel):
    skill: str
    score: int # El puntaje es un entero de 0 a 100

class User(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Modelo para guardar los resultados del quiz
class QuizResult(BaseModel):
    # CAMBIO AQUÍ: str -> int (porque enviamos valores del 1 al 5)
    answers: Dict[str, int] # {q1: 5, q2: 3, ...}
    softSkills: List[SoftSkillScore]
    profile: str
    date: str
    # Campos opcionales para metadatos extra si los envías
    profileDescription: Optional[str] = None
