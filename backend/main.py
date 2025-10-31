from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from models import users_collection
from schemas import User, UserLogin, QuizResult
from auth import create_token, verify_token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia a tu dominio de Netlify luego
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Registro ----------
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
        "quizzes": []
    })
    return {"message": "Usuario registrado correctamente"}

# ---------- Login ----------
@app.post("/api/login")
def login_user(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    token = create_token({"email": db_user["email"]})
    return {"token": token, "name": db_user["name"]}

# ---------- Guardar Quiz ----------
@app.post("/api/quiz")
def save_quiz(result: QuizResult, authorization: str = Header(None)):
    token = authorization.split(" ")[1] if authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]
    users_collection.update_one(
        {"email": email},
        {"$push": {"quizzes": result.dict()}}
    )
    return {"message": "Quiz guardado correctamente"}

# ---------- Obtener quizzes del usuario ----------
@app.get("/api/quizzes")
def get_quizzes(authorization: str = Header(None)):
    token = authorization.split(" ")[1] if authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0, "quizzes": 1})
    return user.get("quizzes", [])

@app.get("/api/user")
def get_user_info(authorization: str = Header(None)):
    token = authorization.split(" ")[1] if authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0, "name": 1, "email": 1})
    return user
