from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from typing import Optional 

from .models import users_collection, all_responses_collection 
from .schemas import User, UserLogin, QuizResult
from .auth import create_token, verify_token

app = FastAPI()

# 🛑 Middleware de logging ELIMINADO para evitar consumir el cuerpo de la petición (JSON).

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RUTAS DE AUTENTICACIÓN ---

@app.post("/api/register")
def register_user(user: User):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
    })
    return {"message": "Usuario registrado correctamente"}

@app.post("/api/login")
def login_user(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    token = create_token({"email": db_user["email"]})
    return {"token": token, "name": db_user["name"]}


# --- RUTAS DEL QUIZ ---

# ---------- Guardar Quiz (VERSION DE PRUEBA EXITOSA) ----------
@app.post("/api/quiz/") # Mantenemos la barra final
def save_quiz(result: QuizResult):
    # Ya no se requiere el token ni el Header.
    email = "temp_user@test.com" # EMAIL TEMPORAL
    
    quiz_data = result.dict()
    quiz_data["user_email"] = email
    
    all_responses_collection.insert_one(quiz_data)

    return {"message": "¡PRUEBA EXITOSA! Quiz guardado."}


# ---------- Obtener quizzes del usuario ----------
@app.get("/api/quizzes")
def get_quizzes(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]
    
    quizzes_cursor = all_responses_collection.find({"user_email": email}, {"_id": 0})
    quizzes_list = list(quizzes_cursor)
    
    return quizzes_list

@app.get("/api/user")
def get_user_info(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
    user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0, "name": 1, "email": 1})
    return user
