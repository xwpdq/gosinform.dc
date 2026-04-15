from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


PriceType = Literal["numeric", "external"]
BillingType = Literal["monthly", "one_time"]


class TariffItem(BaseModel):
    tariff_id: str
    section: str
    service: str
    parameter: str
    unit: str
    price_raw: str
    price_value: float | None = None
    price_type: PriceType
    billing_type: BillingType


class TariffListResponse(BaseModel):
    source_url: str
    extracted_at: datetime
    items: list[TariffItem] = Field(default_factory=list)
