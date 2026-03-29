import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SQLALCHEMY_DATABASE_URL
from app.routes import auth, admin
from app.routes import company, users, expenses, ocr

# Dev fallback: create tables automatically for local SQLite
if SQLALCHEMY_DATABASE_URL.startswith("sqlite") and os.getenv("APP_ENV", "development").lower() in {
    "development",
    "dev",
    "local",
}:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartReimburse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(os.path.join(uploads_dir, "receipts"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(company.router)
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(ocr.router)

@app.get("/")
def read_root():
    return {"message": "SmartReimburse API is running"}
