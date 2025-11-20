from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from typing import Optional, Dict
from datetime import date # ⬅️ Importamos 'date' para manejar la fecha actual

# Asegúrate de que tus archivos .models, .schemas y .auth existan y funcionen
from .models import users_collection, all_responses_collection 
from .schemas import User, UserLogin, QuizResult
from .auth import create_token, verify_token

app = FastAPI()

# 🛑 Middleware de logging ELIMINADO

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

# ---------- Guardar Quiz (VERSION FINAL CON INSERCIÓN DE FECHA) ----------
@app.post("/api/quiz/") 
def save_quiz(result: QuizResult, authorization: Optional[str] = Header(None)):
    
    # 1. Verificar el token del usuario (necesario para el bloqueo)
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado. Inicia sesión para guardar resultados.")

    email = user_data["email"]

    # 2. Preparar los datos y la fecha actual
    quiz_data = result.dict()
    quiz_data["user_email"] = email
    
    # 🌟 CAMBIO CLAVE: Guardamos la fecha de hoy en formato YYYY-MM-DD
    quiz_data["date"] = date.today().isoformat() 
    
    # 3. Insertar en la colección
    all_responses_collection.insert_one(quiz_data)

    return {"message": "Quiz guardado correctamente en la base de datos."}


# ---------- CONSULTAR ESTADO DE COOLDOWN (BLOQUEO) ----------
@app.get("/api/quiz/cooldown")
def get_cooldown_status(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]

    # Buscar el quiz más reciente, ordenado por fecha descendente
    # La fecha debe estar guardada en formato YYYY-MM-DD para que la ordenación funcione
    latest_quiz = all_responses_collection.find(
        {"user_email": email}, 
        {"date": 1, "_id": 0} 
    ).sort("date", -1).limit(1)

    latest_quiz_data = list(latest_quiz)

    if latest_quiz_data:
        # Devuelve la fecha del último quiz guardado
        return {"last_completion_date": latest_quiz_data[0].get("date")}
    else:
        # Si no hay quizzes, devuelve nulo
        return {"last_completion_date": None}


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

