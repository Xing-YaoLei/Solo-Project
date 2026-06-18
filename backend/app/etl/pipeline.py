from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, TypeVar
import time

import pandas as pd

from app.utils.helpers import utc_now, humanize_duration


T = TypeVar("T")


@dataclass
class PipelineStats:
    source: str = ""
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    extract_records: int = 0
    extract_duration_ms: int = 0
    transform_deduped: int = 0
    transform_normalized: int = 0
    transform_filled: int = 0
    transform_duration_ms: int = 0
    load_inserted: int = 0
    load_updated: int = 0
    load_failed: int = 0
    load_duration_ms: int = 0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def total_duration_ms(self) -> int:
        return (
            self.extract_duration_ms
            + self.transform_duration_ms
            + self.load_duration_ms
        )

    @property
    def total_duration_human(self) -> str:
        return humanize_duration(self.total_duration_ms / 1000)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "extract": {
                "records": self.extract_records,
                "duration_ms": self.extract_duration_ms,
            },
            "transform": {
                "deduped": self.transform_deduped,
                "normalized": self.transform_normalized,
                "filled": self.transform_filled,
                "duration_ms": self.transform_duration_ms,
            },
            "load": {
                "inserted": self.load_inserted,
                "updated": self.load_updated,
                "failed": self.load_failed,
                "duration_ms": self.load_duration_ms,
            },
            "total_duration_ms": self.total_duration_ms,
            "total_duration_human": self.total_duration_human,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class ETLPipeline(ABC):
    def __init__(self, source: str):
        self.source = source
        self.stats = PipelineStats(source=source)
        self._extract_callbacks: List[Callable[[pd.DataFrame], pd.DataFrame]] = []
        self._transform_callbacks: List[Callable[[pd.DataFrame], pd.DataFrame]] = []
        self._load_callbacks: List[Callable[[pd.DataFrame], Any]] = []

    def register_extract(self, fn: Callable[[pd.DataFrame], pd.DataFrame]) -> None:
        self._extract_callbacks.append(fn)

    def register_transform(self, fn: Callable[[pd.DataFrame], pd.DataFrame]) -> None:
        self._transform_callbacks.append(fn)

    def register_load(self, fn: Callable[[pd.DataFrame], Any]) -> None:
        self._load_callbacks.append(fn)

    @abstractmethod
    async def extract(self) -> pd.DataFrame:
        ...

    @abstractmethod
    async def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        ...

    @abstractmethod
    async def load(self, df: pd.DataFrame) -> Any:
        ...

    async def run(self) -> PipelineStats:
        self.stats = PipelineStats(source=self.source)
        self.stats.started_at = utc_now()

        try:
            t0 = time.perf_counter()
            df = await self.extract()
            for cb in self._extract_callbacks:
                df = cb(df)
            self.stats.extract_records = len(df) if df is not None else 0
            self.stats.extract_duration_ms = int((time.perf_counter() - t0) * 1000)
        except Exception as exc:
            self.stats.errors.append(f"[extract] {type(exc).__name__}: {exc}")
            self.stats.finished_at = utc_now()
            return self.stats

        try:
            t1 = time.perf_counter()
            df = await self.transform(df)
            for cb in self._transform_callbacks:
                df = cb(df)
            self.stats.transform_duration_ms = int((time.perf_counter() - t1) * 1000)
        except Exception as exc:
            self.stats.errors.append(f"[transform] {type(exc).__name__}: {exc}")
            self.stats.finished_at = utc_now()
            return self.stats

        try:
            t2 = time.perf_counter()
            result = await self.load(df)
            for cb in self._load_callbacks:
                cb(df)
            self.stats.load_duration_ms = int((time.perf_counter() - t2) * 1000)
            if isinstance(result, dict):
                self.stats.load_inserted = int(result.get("inserted", 0))
                self.stats.load_updated = int(result.get("updated", 0))
                self.stats.load_failed = int(result.get("failed", 0))
        except Exception as exc:
            self.stats.errors.append(f"[load] {type(exc).__name__}: {exc}")

        self.stats.finished_at = utc_now()
        return self.stats


class GenericETLPipeline(ETLPipeline):
    def __init__(
        self,
        source: str,
        extract_fn: Optional[Callable[[], pd.DataFrame]] = None,
        transform_fn: Optional[Callable[[pd.DataFrame], pd.DataFrame]] = None,
        load_fn: Optional[Callable[[pd.DataFrame], Any]] = None,
    ):
        super().__init__(source)
        self._extract_fn = extract_fn
        self._transform_fn = transform_fn
        self._load_fn = load_fn

    async def extract(self) -> pd.DataFrame:
        if self._extract_fn is None:
            return pd.DataFrame()
        try:
            result = self._extract_fn()
            if asyncio.iscoroutine(result):
                result = await result
            return result if isinstance(result, pd.DataFrame) else pd.DataFrame(result)
        except NotImplementedError:
            return pd.DataFrame()

    async def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if self._transform_fn is None:
            return df
        result = self._transform_fn(df)
        if asyncio.iscoroutine(result):
            result = await result
        return result

    async def load(self, df: pd.DataFrame) -> Any:
        if self._load_fn is None:
            return {"inserted": 0, "updated": 0, "failed": len(df) if df is not None else 0}
        result = self._load_fn(df)
        if asyncio.iscoroutine(result):
            result = await result
        return result


__all__ = ["PipelineStats", "ETLPipeline", "GenericETLPipeline"]
