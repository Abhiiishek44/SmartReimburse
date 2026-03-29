# SmartReimburse

A reimbursement management system with a **FastAPI** backend and a **React (Vite)** frontend. It supports expense submission, multi-step approvals, OCR receipt scanning, and role-based dashboards.

## 📦 Project Structure

```
backend/   # FastAPI, SQLAlchemy, Alembic, SQLite
frontend/  # React + Vite + Tailwind
```

## ✅ Backend Overview

- **Framework**: FastAPI
- **Database**: SQLite (local), SQLAlchemy ORM
- **Migrations**: Alembic
- **Auth**: JWT (access + refresh tokens)
- **OCR**: pytesseract + Pillow

### Key Services
- `app/routes/expenses.py` — expense CRUD & submit flow
- `app/routes/ocr.py` — OCR upload endpoint
- `app/services/expense_service.py` — approval workflow
- `app/services/ocr_service.py` — OCR parsing

### Database + Alembic
- Alembic is configured under `backend/alembic/`
- `alembic/env.py` uses `Base.metadata` for autogenerate

### Backend Run
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Run Migrations
```bash
cd backend
alembic upgrade head
```

---

## ✅ Frontend Overview

- **Framework**: React + Vite
- **Styling**: TailwindCSS
- **API Client**: Axios

### Key Screens
- `My Expenses` — employee expense list
- `Submit Expense` — OCR + manual form
- `Approvals` — manager/finance/director flows

### Frontend Run
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Auth Tokens
Frontend stores tokens in `localStorage`:
- `access_token`
- `refresh_token`

The API automatically refreshes tokens using `/auth/refresh`.

---

## 🧪 Useful Commands

### Backend Tests (OCR)
```bash
cd backend
python test_ocr.py
```

### Frontend Lint
```bash
cd frontend
npm run lint
```

---

## 🖼️ OCR Setup
If OCR fails, install Tesseract:

- **Linux**: `sudo apt-get install tesseract-ocr`
- **macOS**: `brew install tesseract`
- **Windows**: https://github.com/UB-Mannheim/tesseract/wiki

You can also set `TESSERACT_CMD` to the full path of the binary.

---

## ✅ Notes
- Local SQLite is fine for development.
- Use Alembic for schema changes instead of deleting the database.
- If you add new models or columns, run:
  ```bash
  alembic revision --autogenerate -m "your message"
  alembic upgrade head
  ```
