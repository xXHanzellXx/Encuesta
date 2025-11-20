from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
# IMPORTACIONES CORREGIDAS: Se asume que 'all_responses_collection' también se importa de .models
# Este es el nuevo lugar donde se guardarán todas las respuestas de los quizzes.
from .models import users_collection, all_responses_collection 
from .schemas import User, UserLogin, QuizResult
from .auth import create_token, verify_token
from typing import Optional # Para tipado de Header

app = FastAPI()

from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"🔍 RUTA SOLICITADA: {request.method} {request.url.path}")
    response = await call_next(request)
    if response.status_code == 404:
        print("❌ ERROR 404 DETECTADO EN LA RUTA ANTERIOR")
    return response

app.add_middleware(
    CORSMiddleware,
    # Deja "*" por ahora, pero cámbialo a tu URL de Netlify luego por seguridad.
    allow_origins=["*"],
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

    # Hasheo de la contraseña
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Nota: El campo "quizzes" no se incluye, ya que se guardará en una colección separada.
    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
    })
    return {"message": "Usuario registrado correctamente"}

# ---------- Login ----------
@app.post("/api/login")
def login_user(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    # Verificación de la contraseña
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    # Creación del token JWT
    token = create_token({"email": db_user["email"]})
    return {"token": token, "name": db_user["name"]}

# ---------- Guardar Quiz (USA COLECCIÓN SEPARADA) ----------
@app.post("/api/quiz/") # ¡Añadir la barra inclinada final!
def save_quiz(result: QuizResult, authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]

    # Preparar el documento del quiz añadiendo el email del usuario para enlazarlo
    quiz_data = result.dict()
    quiz_data["user_email"] = email
    
    # CORRECTO: Insertar en la colección dedicada de todas las respuestas
    all_responses_collection.insert_one(quiz_data)

    return {"message": "Quiz guardado correctamente en la colección de respuestas"}

# ---------- Obtener quizzes del usuario (CONSULTA COLECCIÓN SEPARADA) ----------
@app.get("/api/quizzes")
def get_quizzes(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]
    
    # CORRECTO: Consultar la colección dedicada 'all_responses_collection'
    quizzes_cursor = all_responses_collection.find({"user_email": email}, {"_id": 0})
    
    # Convertir el cursor de resultados a una lista
    quizzes_list = list(quizzes_cursor)
    
    return quizzes_list

@app.get("/api/user")
def get_user_info(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    # Obtiene solo el nombre y el email del usuario
    user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0, "name": 1, "email": 1})
    return user


