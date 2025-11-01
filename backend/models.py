from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("mongodb+srv://hanzell:UwU@cluster0.3wjtgsa.mongodb.net/?appName=Cluster0"))
db = client["softskills360"]
users_collection = db["users"]

