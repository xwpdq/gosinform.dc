from typing import Literal

from pydantic import BaseModel, Field


BillingType = Literal["monthly", "one_time"]


class EstimateItemInput(BaseModel):
    code: str
    title: str | None = None
    billing_type: BillingType = Field(default="monthly")
    quantity: float = Field(default=1, ge=0)
    unit_price: float = Field(..., ge=0)


class EstimateRequest(BaseModel):
    items: list[EstimateItemInput] = Field(default_factory=list)


class EstimateItemResult(BaseModel):
    code: str
    title: str | None = None
    billing_type: BillingType
    quantity: float
    unit_price: float
    line_total: float


class EstimateResponse(BaseModel):
    currency: str = "RUB"
    monthly_total: float
    one_time_total: float
    grand_total: float
    items: list[EstimateItemResult] = Field(default_factory=list)
