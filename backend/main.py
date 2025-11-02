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
    
    # Nota: El campo "quizzes" se elimina del documento de usuario, 
    # ya que las respuestas se guardarán en una colección separada.
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

# ---------- Guardar Quiz (¡MODIFICADO!) ----------
@app.post("/api/quiz")
def save_quiz(result: QuizResult, authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]

    # Preparar el documento del quiz añadiendo el email del usuario para enlazarlo
    quiz_data = result.dict()
    quiz_data["user_email"] = email
    
    # Insertar en la colección dedicada de todas las respuestas
    all_responses_collection.insert_one(quiz_data)

    # Nota: Se ha eliminado la lógica anterior que hacía un $push al documento del usuario.
    
    return {"message": "Quiz guardado correctamente en la colección de respuestas"}

# ---------- Obtener quizzes del usuario (¡MODIFICADO!) ----------
@app.get("/api/quizzes")
def get_quizzes(authorization: Optional[str] = Header(None)):
    token = authorization.split(" ")[1] if authorization and " " in authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    email = user_data["email"]
    
    # Consultar la colección dedicada 'all_responses_collection' por el email del usuario
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
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
# IMPORTACIONES CORREGIDAS: Se añade '.' para hacerlas relativas al directorio 'backend'
from .models import users_collection 
from .schemas import User, UserLogin, QuizResult
from .auth import create_token, verify_token

app = FastAPI()

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

    # Verificación de la contraseña
    if not bcrypt.checkpw(user.password.encode('utf-8'), db_user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    # Creación del token JWT
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
    # Guardar resultado del quiz en el array 'quizzes' del usuario
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
    # Devuelve el array de quizzes o un array vacío si no existe
    return user.get("quizzes", [])

@app.get("/api/user")
def get_user_info(authorization: str = Header(None)):
    token = authorization.split(" ")[1] if authorization else None
    user_data = verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    # Obtiene solo el nombre y el email del usuario
    user = users_collection.find_one({"email": user_data["email"]}, {"_id": 0, "name": 1, "email": 1})
    return user

