from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv() 

client = MongoClient(os.getenv("MONGO_URI")) # <--- Usa la variable
db = client["softskills360"]
users_collection = db["users"]
