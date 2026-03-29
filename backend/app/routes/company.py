from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import User
from app.schemas.company import CompanyResponse, CompanyUpdateRequest
from app.services import company_service

router = APIRouter(prefix="/company", tags=["company"])


@router.get("/me", response_model=CompanyResponse)
def get_my_company(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return company_service.get_company_by_id(db, current_user.company_id)


@router.put("/update", response_model=CompanyResponse)
def update_company(update_data: CompanyUpdateRequest, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return company_service.update_company(db, current_user.company_id, update_data)


@router.get("/currency-rates")
async def get_currency_rates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    company = company_service.get_company_by_id(db, current_user.company_id)
    return await company_service.fetch_exchange_rates(company.base_currency)


@router.get("/countries")
async def get_countries(current_user: User = Depends(get_current_user)):
    return await company_service.fetch_countries()
