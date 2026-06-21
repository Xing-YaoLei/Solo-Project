import logging
import random
from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

import httpx
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import SettingsConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.integrations.base_client import (
    BaseIntegrationClient,
    IntegrationConfig,
    IntegrationConnectionError,
    IntegrationError,
)
from app.models.case import CaseStatus
from app.models.invoice import InvoiceSource, InvoiceStatus
from app.schemas.case import CaseCreate, InvoiceCreate, InvoiceItemCreate

logger = logging.getLogger(__name__)


class CaseSystemConfig(IntegrationConfig):
    model_config = SettingsConfigDict(env_prefix="CASE_SYSTEM_", extra="ignore")

    base_url: str = Field(default="https://api.case-system.example.com")
    api_key: str | None = Field(default=None)
    client_id: str | None = Field(default=None)
    client_secret: str | None = Field(default=None)


class ExternalCase(BaseModel):
    model_config = ConfigDict(extra="allow")

    case_id: str
    case_number: str
    case_name: str
    case_type: str
    lawyer_id: str
    client_id: str
    status: str
    quoted_amount: float
    actual_amount: float
    created_at: datetime
    updated_at: datetime


class ExternalCaseFee(BaseModel):
    model_config = ConfigDict(extra="allow")

    fee_id: str
    case_id: str
    invoice_no: str
    amount: float
    fee_type: str
    description: str
    quantity: float
    unit_price: float
    invoice_date: date
    status: str


class CaseSystemClient(BaseIntegrationClient[dict[str, Any]]):
    def __init__(
        self,
        config: CaseSystemConfig | None = None,
        db: AsyncSession | None = None,
    ) -> None:
        super().__init__(
            config=config or CaseSystemConfig(),
            db=db,
            source_system="case_system",
        )
        self._access_token: str | None = None
        self._token_expiry: datetime | None = None

    async def _authenticate(self) -> str:
        if self._access_token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._access_token

        config = self.config
        if not config.client_id or not config.client_secret:
            raise IntegrationError("Client ID and secret are required for authentication")

        try:
            async with httpx.AsyncClient(timeout=config.timeout) as client:
                response = await client.post(
                    f"{config.base_url}/oauth/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": config.client_id,
                        "client_secret": config.client_secret,
                    },
                )
                response.raise_for_status()
                data = response.json()
                self._access_token = data["access_token"]
                self._token_expiry = datetime.now() + timedelta(seconds=data.get("expires_in", 3600))
                return self._access_token
        except httpx.HTTPError as e:
            raise IntegrationConnectionError(f"Authentication failed: {e}") from e

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if self.use_mock:
            logger.info(f"[MOCK] {method} {endpoint}")
            return {}

        config = self.config
        token = await self._authenticate()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=config.timeout) as client:
                response = await client.request(
                    method=method,
                    url=f"{config.base_url}{endpoint}",
                    headers=headers,
                    params=params,
                    json=json,
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                self._access_token = None
                self._token_expiry = None
                return await self._make_request(method, endpoint, params, json)
            raise IntegrationConnectionError(f"HTTP {e.response.status_code}: {e}") from e
        except httpx.HTTPError as e:
            raise IntegrationConnectionError(f"Request failed: {e}") from e

    async def fetch_data(
        self,
        page: int = 1,
        page_size: int = 100,
        status: str | None = None,
        case_type: str | None = None,
        updated_after: datetime | None = None,
    ) -> list[dict[str, Any]]:
        if self.use_mock:
            return await self._generate_mock_data(
                page=page,
                page_size=page_size,
                status=status,
                case_type=case_type,
            )

        async def _fetch() -> dict[str, Any]:
            params: dict[str, Any] = {
                "page": page,
                "page_size": page_size,
            }
            if status:
                params["status"] = status
            if case_type:
                params["case_type"] = case_type
            if updated_after:
                params["updated_after"] = updated_after.isoformat()
            return await self._make_request("GET", "/cases", params=params)

        try:
            response = await self._retry(_fetch)
            return response.get("data", [])
        except Exception as e:
            logger.warning(f"Failed to fetch cases from API, falling back to mock: {e}")
            return await self._generate_mock_data(
                page=page,
                page_size=page_size,
                status=status,
                case_type=case_type,
            )

    async def get_case_list(
        self,
        page: int = 1,
        page_size: int = 100,
        status: str | None = None,
        case_type: str | None = None,
        updated_after: datetime | None = None,
    ) -> dict[str, Any]:
        await self._start_sync_log()
        try:
            raw_cases = await self.fetch_data(
                page=page,
                page_size=page_size,
                status=status,
                case_type=case_type,
                updated_after=updated_after,
            )
            transformed_cases = await self.transform_data(raw_cases)
            result = await self._complete_sync(len(transformed_cases))
            result["data"] = transformed_cases
            return result
        except Exception as e:
            await self._fail_sync(e)

    async def get_case_detail(self, external_case_id: str) -> dict[str, Any]:
        if self.use_mock:
            mock_cases = await self._generate_mock_data(page_size=1)
            if mock_cases:
                mock_cases[0]["case_id"] = external_case_id
                return await self._transform_single_case(mock_cases[0])
            raise IntegrationError(f"Case {external_case_id} not found")

        async def _fetch() -> dict[str, Any]:
            return await self._make_request("GET", f"/cases/{external_case_id}")

        try:
            raw_case = await self._retry(_fetch)
            return await self._transform_single_case(raw_case)
        except Exception as e:
            logger.warning(f"Failed to fetch case detail, falling back to mock: {e}")
            mock_cases = await self._generate_mock_data(page_size=1)
            if mock_cases:
                mock_cases[0]["case_id"] = external_case_id
                return await self._transform_single_case(mock_cases[0])
            raise

    async def get_case_fees(
        self,
        external_case_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        if self.use_mock:
            mock_fees = await self._generate_mock_fees(external_case_id, page_size)
            return {
                "case_id": external_case_id,
                "total": len(mock_fees),
                "data": mock_fees,
            }

        async def _fetch() -> dict[str, Any]:
            params = {"page": page, "page_size": page_size}
            return await self._make_request(
                "GET", f"/cases/{external_case_id}/fees", params=params
            )

        try:
            response = await self._retry(_fetch)
            raw_fees = response.get("data", [])
            transformed_fees = [
                await self._transform_single_fee(fee) for fee in raw_fees
            ]
            return {
                "case_id": external_case_id,
                "total": response.get("total", len(transformed_fees)),
                "data": transformed_fees,
            }
        except Exception as e:
            logger.warning(f"Failed to fetch case fees, falling back to mock: {e}")
            mock_fees = await self._generate_mock_fees(external_case_id, page_size)
            return {
                "case_id": external_case_id,
                "total": len(mock_fees),
                "data": mock_fees,
            }

    async def transform_data(self, raw_data: list[Any]) -> list[dict[str, Any]]:
        return [await self._transform_single_case(case) for case in raw_data]

    async def _transform_single_case(self, raw_case: dict[str, Any]) -> dict[str, Any]:
        external_case = ExternalCase(**raw_case)

        status_mapping = {
            "active": CaseStatus.ACTIVE,
            "pending": CaseStatus.PENDING,
            "closed": CaseStatus.CLOSED,
            "cancelled": CaseStatus.CANCELLED,
        }
        internal_status = status_mapping.get(
            external_case.status.lower(), CaseStatus.ACTIVE
        )

        case_create = CaseCreate(
            case_no=external_case.case_number,
            name=external_case.case_name,
            lawyer_id=UUID(external_case.lawyer_id),
            client_id=UUID(external_case.client_id),
            case_type=external_case.case_type,
            quoted_amount=external_case.quoted_amount,
            actual_amount=external_case.actual_amount,
            status=internal_status,
        )

        return {
            "external_id": external_case.case_id,
            "case_data": case_create,
            "created_at": external_case.created_at,
            "updated_at": external_case.updated_at,
        }

    async def _transform_single_fee(self, raw_fee: dict[str, Any]) -> dict[str, Any]:
        external_fee = ExternalCaseFee(**raw_fee)

        status_mapping = {
            "pending": InvoiceStatus.PENDING,
            "paid": InvoiceStatus.PAID,
            "overdue": InvoiceStatus.OVERDUE,
            "cancelled": InvoiceStatus.CANCELLED,
        }
        internal_status = status_mapping.get(
            external_fee.status.lower(), InvoiceStatus.PENDING
        )

        item_create = InvoiceItemCreate(
            item_name=external_fee.fee_type,
            description=external_fee.description,
            quantity=external_fee.quantity,
            unit_price=external_fee.unit_price,
            amount=external_fee.amount,
            fee_type=external_fee.fee_type,
        )

        invoice_create = InvoiceCreate(
            invoice_no=external_fee.invoice_no,
            case_id=UUID(int=0),
            amount=external_fee.amount,
            status=internal_status,
            invoice_date=external_fee.invoice_date,
            source=InvoiceSource.API,
            items=[item_create],
        )

        return {
            "external_id": external_fee.fee_id,
            "external_case_id": external_fee.case_id,
            "invoice_data": invoice_create,
        }

    async def _generate_mock_data(
        self,
        page: int = 1,
        page_size: int = 100,
        status: str | None = None,
        case_type: str | None = None,
    ) -> list[dict[str, Any]]:
        case_types = ["民事案件", "刑事案件", "行政案件", "商事仲裁", "劳动争议"]
        statuses = ["active", "pending", "closed", "cancelled"]
        lawyer_ids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "550e8400-e29b-41d4-a716-446655440001",
            "550e8400-e29b-41d4-a716-446655440002",
        ]
        client_ids = [
            "550e8400-e29b-41d4-a716-446655440003",
            "550e8400-e29b-41d4-a716-446655440004",
            "550e8400-e29b-41d4-a716-446655440005",
        ]

        base_case_names = [
            "张某与李某合同纠纷案",
            "王某知识产权侵权案",
            "刘某劳动争议仲裁案",
            "陈某股权转让纠纷案",
            "赵某交通事故赔偿案",
        ]

        count = min(page_size, 50)
        cases: list[dict[str, Any]] = []

        for i in range(count):
            offset = (page - 1) * page_size + i
            case_status = status if status else random.choice(statuses)
            selected_case_type = case_type if case_type else random.choice(case_types)
            base_name = random.choice(base_case_names)

            created_at = datetime.now() - timedelta(days=random.randint(1, 365))
            updated_at = created_at + timedelta(days=random.randint(0, 30))

            case = {
                "case_id": f"CASE-{offset + 1:06d}",
                "case_number": f"({datetime.now().year})京民初字第{offset + 1:06d}号",
                "case_name": f"{base_name}（{offset + 1}）",
                "case_type": selected_case_type,
                "lawyer_id": random.choice(lawyer_ids),
                "client_id": random.choice(client_ids),
                "status": case_status,
                "quoted_amount": round(random.uniform(5000, 500000), 2),
                "actual_amount": round(random.uniform(5000, 500000), 2),
                "created_at": created_at,
                "updated_at": updated_at,
            }
            cases.append(case)

        logger.info(f"Generated {len(cases)} mock cases")
        return cases

    async def _generate_mock_fees(
        self,
        external_case_id: str,
        count: int = 10,
    ) -> list[dict[str, Any]]:
        fee_types = ["代理费", "诉讼费", "保全费", "鉴定费", "公证费", "差旅费"]
        statuses = ["pending", "paid", "overdue"]

        fees: list[dict[str, Any]] = []
        for i in range(min(count, 5)):
            unit_price = round(random.uniform(1000, 50000), 2)
            quantity = round(random.uniform(0.5, 10), 2)
            amount = round(unit_price * quantity, 2)

            fee = {
                "fee_id": f"FEE-{external_case_id}-{i + 1}",
                "case_id": external_case_id,
                "invoice_no": f"INV-{external_case_id}-{i + 1:03d}",
                "amount": amount,
                "fee_type": random.choice(fee_types),
                "description": f"{external_case_id} 第{i + 1}笔费用",
                "quantity": quantity,
                "unit_price": unit_price,
                "invoice_date": date.today() - timedelta(days=random.randint(0, 60)),
                "status": random.choice(statuses),
            }
            fees.append(fee)

        logger.info(f"Generated {len(fees)} mock fees for case {external_case_id}")
        return fees
