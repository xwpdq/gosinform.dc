import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _get_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None or raw_value.strip() == "":
        return default
    try:
        return int(raw_value)
    except ValueError as exc:
        raise ValueError(f"Environment variable '{name}' must be an integer.") from exc


def _get_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None or raw_value.strip() == "":
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _get_list_env(name: str, default: str) -> list[str]:
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    APP_NAME: str
    APP_VERSION: str
    APP_HOST: str
    APP_PORT: int
    APP_RELOAD: bool
    API_PREFIX: str
    FRONTEND_ORIGINS: list[str]
    TARIFF_SOURCE_URL: str
    TARIFF_TABLE_ID: str
    TARIFF_CACHE_TTL_SEC: int
    TARIFF_ALLOW_INSECURE_SSL: bool
    TARIFF_REQUEST_TIMEOUT_SEC: int
    TARIFF_REQUEST_RETRIES: int
    TARIFF_USER_AGENT: str

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            APP_NAME=os.getenv("APP_NAME", "Госинформ"),
            APP_VERSION=os.getenv("APP_VERSION", "0.1.0"),
            APP_HOST=os.getenv("APP_HOST", "127.0.0.1"),
            APP_PORT=_get_int_env("APP_PORT", 8000),
            APP_RELOAD=_get_bool_env("APP_RELOAD", False),
            API_PREFIX=os.getenv("API_PREFIX", "/api"),
            FRONTEND_ORIGINS=_get_list_env(
                "FRONTEND_ORIGINS",
                "http://localhost:3000,http://localhost:5173",
            ),
            TARIFF_SOURCE_URL=os.getenv(
                "TARIFF_SOURCE_URL",
                "https://gosinform.ru/?page_id=1294",
            ),
            TARIFF_TABLE_ID=os.getenv("TARIFF_TABLE_ID", "wpdtSimpleTable-11"),
            TARIFF_CACHE_TTL_SEC=_get_int_env("TARIFF_CACHE_TTL_SEC", 300),
            TARIFF_ALLOW_INSECURE_SSL=_get_bool_env(
                "TARIFF_ALLOW_INSECURE_SSL",
                True,
            ),
            TARIFF_REQUEST_TIMEOUT_SEC=_get_int_env(
                "TARIFF_REQUEST_TIMEOUT_SEC",
                15,
            ),
            TARIFF_REQUEST_RETRIES=_get_int_env("TARIFF_REQUEST_RETRIES", 3),
            TARIFF_USER_AGENT=os.getenv(
                "TARIFF_USER_AGENT",
                "gosinform-dc/1.0",
            ),
        )


settings = Settings.from_env()
