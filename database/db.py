import os
from flask_pymongo import PyMongo
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# MongoDB Atlas Primary Connection String
MONGO_URI = os.getenv(
    'MONGO_URI',
    'mongodb+srv://admin:SSECIT2026@cluster0.lhna7yh.mongodb.net/ssec_timetable?retryWrites=true&w=majority&appName=Cluster0'
)
MONGO_DBNAME = os.getenv('MONGO_DB_NAME', 'ssec_timetable')

mongo = PyMongo()
_client = None

def init_db(app):
    """
    Initialize MongoDB Atlas database connection with PyMongo and Flask application.
    Stores all application collections on the MongoDB Atlas Cloud platform.
    """
    global _client
    app.config['MONGO_URI'] = MONGO_URI
    
    try:
        mongo.init_app(app)
        _client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
        _client.admin.command('ping')
        print(f"Successfully connected to MongoDB Atlas database cluster: {MONGO_URI}")
    except Exception as e:
        print(f"MongoDB Atlas Connection Notice: {e}")
        try:
            _client = MongoClient(MONGO_URI)
        except Exception as client_err:
            print(f"Client initialization notice: {client_err}")

def get_db():
    """
    Returns the active MongoDB database instance pointing to MongoDB Atlas.
    All application data is stored in MongoDB Atlas, not local storage.
    """
    if mongo.db is not None:
        return mongo.db
    if _client is not None:
        return _client[MONGO_DBNAME]
    
    # Standalone PyMongo fallback client
    fallback_client = MongoClient(MONGO_URI)
    return fallback_client[MONGO_DBNAME]

def get_collection(collection_name):
    """
    Helper function to get a specific collection from MongoDB Atlas.
    """
    db = get_db()
    return db[collection_name]

