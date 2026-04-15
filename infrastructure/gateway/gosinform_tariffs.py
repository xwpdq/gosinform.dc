import asyncio
import hashlib
import html
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import aiohttp


@dataclass(frozen=True)
class ParsedTariff:
    tariff_id: str
    section: str
    service: str
    parameter: str
    unit: str
    price_raw: str
    price_value: float | None
    price_type: str
    billing_type: str


class GosinformTariffGateway:
    def __init__(
        self,
        source_url: str,
        table_id: str = "wpdtSimpleTable-11",
        cache_ttl_sec: int = 300,
        request_timeout_sec: int = 15,
        request_retries: int = 3,
        allow_insecure_ssl: bool = True,
        user_agent: str = "gosinform-dc/1.0",
    ) -> None:
        self.source_url = source_url
        self.table_id = table_id
        self.cache_ttl_sec = max(cache_ttl_sec, 0)
        self.request_timeout_sec = max(request_timeout_sec, 1)
        self.request_retries = max(request_retries, 1)
        self.allow_insecure_ssl = allow_insecure_ssl
        self.user_agent = user_agent

        self._cache: list[ParsedTariff] | None = None
        self._cache_until = 0.0
        self._cached_at = datetime.now(timezone.utc)

        self._session: aiohttp.ClientSession | None = None
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        if self._session is not None and not self._session.closed:
            return
        timeout = aiohttp.ClientTimeout(total=float(self.request_timeout_sec))
        self._session = aiohttp.ClientSession(
            timeout=timeout,
            raise_for_status=True,
            headers={"User-Agent": self.user_agent},
        )

    async def close(self) -> None:
        if self._session is not None and not self._session.closed:
            await self._session.close()
        self._session = None

    async def fetch_tariffs(
        self,
        force_refresh: bool = False,
    ) -> tuple[list[ParsedTariff], datetime]:
        now = time.time()
        if (
            not force_refresh
            and self._cache is not None
            and now < self._cache_until
        ):
            return list(self._cache), self._cached_at

        async with self._lock:
            now = time.time()
            if (
                not force_refresh
                and self._cache is not None
                and now < self._cache_until
            ):
                return list(self._cache), self._cached_at

            html_document = await self._download_html()
            table_html = self._extract_table(html_document)
            rows = self._extract_rows(table_html)
            self._validate_rows(rows)
            tariffs = self._normalize_rows(rows)

            self._cache = tariffs
            self._cached_at = datetime.now(timezone.utc)
            self._cache_until = now + self.cache_ttl_sec
            return list(tariffs), self._cached_at

    async def _download_html(self) -> str:
        errors: list[str] = []

        try:
            return await self._request_html(ssl_value=None)
        except Exception as exc:
            errors.append(str(exc))

        if self.allow_insecure_ssl:
            try:
                return await self._request_html(ssl_value=False)
            except Exception as exc:
                errors.append(str(exc))

        raise RuntimeError(
            "Failed to download tariff source. Details: " + " | ".join(errors)
        )

    async def _request_html(self, ssl_value: bool | None) -> str:
        if self._session is None or self._session.closed:
            await self.start()

        if self._session is None:
            raise RuntimeError("HTTP session is not initialized")

        last_error: Exception | None = None

        for attempt in range(1, self.request_retries + 1):
            try:
                async with self._session.get(self.source_url, ssl=ssl_value) as response:
                    return await response.text(encoding="utf-8", errors="replace")
            except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                last_error = exc
                if attempt < self.request_retries:
                    await asyncio.sleep(min(0.2 * attempt, 1.0))
                else:
                    raise

        if last_error is not None:
            raise last_error

        raise RuntimeError("Request failed without details")

    def _extract_table(self, html_document: str) -> str:
        pattern = (
            r'<table[^>]*id=["\']'
            + re.escape(self.table_id)
            + r'["\'][^>]*>[\s\S]*?</table>'
        )
        match = re.search(pattern, html_document, flags=re.IGNORECASE)
        if match is None:
            raise ValueError(
                f"Table '{self.table_id}' was not found at '{self.source_url}'."
            )
        return match.group(0)

    def _extract_rows(self, table_html: str) -> list[list[str]]:
        rows: list[list[str]] = []
        for row_html in re.findall(
            r"<tr[^>]*>([\s\S]*?)</tr>",
            table_html,
            flags=re.IGNORECASE,
        ):
            cells: list[str] = []
            for _, cell_html in re.findall(
                r"<t[dh]([^>]*)>([\s\S]*?)</t[dh]>",
                row_html,
                flags=re.IGNORECASE,
            ):
                cells.append(self._clean_html_text(cell_html))
            if any(cells):
                rows.append(cells)
        return rows

    def _validate_rows(self, rows: list[list[str]]) -> None:
        if not rows:
            raise ValueError("Tariff table is empty.")

        header = " | ".join(rows[0]).lower()
        required_header_parts = (
            "наименование услуги",
            "параметры услуги",
            "единица измерения",
            "стоимость услуги",
        )
        if len(rows[0]) < 4 or any(part not in header for part in required_header_parts):
            raise ValueError("Tariff table header format has changed.")

    def _normalize_rows(self, rows: list[list[str]]) -> list[ParsedTariff]:
        result: list[ParsedTariff] = []
        current_section = ""
        current_service = ""

        for row in rows:
            if not row:
                continue

            if "Наименование услуги" in row[0]:
                continue

            if len(row) == 1:
                current_section = row[0]
                current_service = ""
                continue

            if not current_section:
                raise ValueError("Tariff table format has changed: missing section.")

            service = ""
            parameter = ""
            unit = ""
            price_raw = ""

            if len(row) >= 4:
                service = row[0] or current_service
                parameter = row[1]
                unit = row[2]
                price_raw = row[3]
                if row[0]:
                    current_service = row[0]
            elif len(row) == 3:
                if not current_service:
                    raise ValueError(
                        "Tariff table format has changed: missing base service."
                    )
                service = current_service
                parameter = row[0]
                unit = row[1]
                price_raw = row[2]
            else:
                raise ValueError("Tariff table format has changed: unsupported row.")

            if not service and not parameter:
                continue

            price_value = self._parse_price(price_raw)
            price_type = "numeric" if price_value is not None else "external"
            billing_type = self._infer_billing_type(current_section)
            tariff_id = self._build_tariff_id(current_section, service, parameter, unit)

            result.append(
                ParsedTariff(
                    tariff_id=tariff_id,
                    section=current_section,
                    service=service,
                    parameter=parameter,
                    unit=unit,
                    price_raw=price_raw,
                    price_value=price_value,
                    price_type=price_type,
                    billing_type=billing_type,
                )
            )

        if not result:
            raise ValueError("Tariff table parsed without data rows.")

        return result

    @staticmethod
    def _clean_html_text(cell_html: str) -> str:
        text = re.sub(r"<[^>]+>", " ", cell_html)
        text = html.unescape(text)
        text = text.replace("\xa0", " ")
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _parse_price(price_raw: str) -> float | None:
        lowered = price_raw.lower()
        if "согласно прайс" in lowered:
            return None

        cleaned = price_raw.replace("\xa0", " ").replace(" ", "")
        cleaned = cleaned.replace(",", ".")
        cleaned = re.sub(r"[^0-9.]", "", cleaned)
        if cleaned == "" or cleaned == ".":
            return None

        try:
            return round(float(cleaned), 2)
        except ValueError:
            return None

    @staticmethod
    def _infer_billing_type(section: str) -> str:
        match = re.match(r"^\s*(\d+)", section)
        if match and match.group(1) in {"5", "6", "7", "8"}:
            return "one_time"
        return "monthly"

    @staticmethod
    def _build_tariff_id(section: str, service: str, parameter: str, unit: str) -> str:
        base = f"{section}|{service}|{parameter}|{unit}".lower().strip()
        digest = hashlib.sha1(base.encode("utf-8")).hexdigest()[:12]
        return f"t-{digest}"
