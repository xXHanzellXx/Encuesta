from pydantic import BaseModel
from typing import List, Dict, Optional

# Nuevo modelo para una sola habilidad con su puntaje
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
    answers: Dict[str, str] # {q1: 'Totalmente en desacuerdo', ...}
    softSkills: List[SoftSkillScore] # Lista de objetos SoftSkillScore
    profile: str # El título del perfil (Ej: "El Estratega Visionario")
    date: str # Fecha de realización en formato ISO
