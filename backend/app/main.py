from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, admin
from app.routes import company, users, expenses

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartReimburse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(company.router)
app.include_router(users.router)
app.include_router(expenses.router)

@app.get("/")
def read_root():
    return {"message": "SmartReimburse API is running"}
