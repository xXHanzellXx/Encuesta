from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv() # <--- Esto carga variables de un archivo .env local
# En Render, las variables de entorno se deben configurar directamente en la plataforma, 
# no dependen del archivo .env.

client = MongoClient(os.getenv("MONGO_URI"))
db = client["softskills360"]
users_collection = db["users"]
all_responses_collection = db["quiz_responses"] # <--- ¡Nueva Colección!
    
