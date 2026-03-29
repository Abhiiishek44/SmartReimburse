import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Company
from app.schemas.company import CompanyUpdateRequest


def get_company_by_id(db: Session, company_id) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


def update_company(db: Session, company_id, update_data: CompanyUpdateRequest) -> Company:
    company = get_company_by_id(db, company_id)
    if update_data.name is not None:
        company.name = update_data.name
    if update_data.country is not None:
        company.country = update_data.country
    if update_data.base_currency is not None:
        company.base_currency = update_data.base_currency
    db.commit()
    db.refresh(company)
    return company


async def fetch_exchange_rates(base_currency: str) -> dict:
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency.upper()}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch exchange rates")
        return response.json()


async def fetch_countries() -> list:
    url = "https://restcountries.com/v3.1/all?fields=name,currencies"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=15)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch countries")
        data = response.json()

    result = []
    for item in data:
        country_name = item.get("name", {}).get("common", "Unknown")
        currencies = item.get("currencies", {})
        for code, info in currencies.items():
            result.append({
                "country": country_name,
                "currency_code": code,
                "currency_name": info.get("name", ""),
                "currency_symbol": info.get("symbol", ""),
            })
    result.sort(key=lambda x: x["country"])
    return result
