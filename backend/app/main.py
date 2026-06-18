from fastapi import FastAPI
from app.core.database import Base, engine
from app.models import explaination
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

@app.get("/")
def read_root():
    return {"Hello": "world"}

@app.get("/health")
def health():
    return {"status": "ok"}