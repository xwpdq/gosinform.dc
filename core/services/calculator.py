from core.schemas.calculator import (
    EstimateItemResult,
    EstimateRequest,
    EstimateResponse,
)


def estimate_total(request: EstimateRequest) -> EstimateResponse:
    monthly_total = 0.0
    one_time_total = 0.0
    result_items: list[EstimateItemResult] = []

    for item in request.items:
        line_total = round(item.quantity * item.unit_price, 2)
        if item.billing_type == "monthly":
            monthly_total += line_total
        else:
            one_time_total += line_total

        result_items.append(
            EstimateItemResult(
                code=item.code,
                title=item.title,
                billing_type=item.billing_type,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=line_total,
            )
        )

    monthly_total = round(monthly_total, 2)
    one_time_total = round(one_time_total, 2)
    grand_total = round(monthly_total + one_time_total, 2)

    return EstimateResponse(
        monthly_total=monthly_total,
        one_time_total=one_time_total,
        grand_total=grand_total,
        items=result_items,
    )
