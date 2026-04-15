from config import settings
from infrastructure.gateway.gosinform_tariffs import GosinformTariffGateway

tariff_gateway = GosinformTariffGateway(
    source_url=settings.TARIFF_SOURCE_URL,
    table_id=settings.TARIFF_TABLE_ID,
    cache_ttl_sec=settings.TARIFF_CACHE_TTL_SEC,
    request_timeout_sec=settings.TARIFF_REQUEST_TIMEOUT_SEC,
    request_retries=settings.TARIFF_REQUEST_RETRIES,
    allow_insecure_ssl=settings.TARIFF_ALLOW_INSECURE_SSL,
    user_agent=settings.TARIFF_USER_AGENT,
)

__all__ = ("GosinformTariffGateway", "tariff_gateway")
