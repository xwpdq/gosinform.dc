from dataclasses import asdict
import logging

from core.schemas.calculator import EstimateRequest, EstimateResponse
from core.schemas.tariffs import TariffItem, TariffListResponse
from core.services.calculator import estimate_total
from fastapi import APIRouter, HTTPException
from infrastructure.gateway import tariff_gateway

v1_router = APIRouter(prefix="/v1", tags=["v1"])
logger = logging.getLogger(__name__)


@v1_router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@v1_router.post("/calculator/estimate", response_model=EstimateResponse)
async def estimate(request: EstimateRequest) -> EstimateResponse:
    return estimate_total(request)


@v1_router.get("/calculator/tariffs", response_model=TariffListResponse)
async def list_tariffs(refresh: bool = False) -> TariffListResponse:
    try:
        items, extracted_at = await tariff_gateway.fetch_tariffs(refresh)
        return TariffListResponse(
            source_url=tariff_gateway.source_url,
            extracted_at=extracted_at,
            items=[TariffItem.model_validate(asdict(item)) for item in items],
        )
    except Exception:
        logger.exception("Failed to fetch tariffs from source")
        raise HTTPException(
            status_code=502,
            detail="Тарифы временно недоступны.",
        ) from None
