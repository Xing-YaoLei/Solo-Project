from __future__ import annotations

import importlib
import logging
from typing import Any

logger = logging.getLogger(__name__)

_ROUTER_MODULES = [
    ("auth", "auth"),
    ("stores", "stores"),
    ("vehicles", "vehicles"),
    ("documents", "documents"),
    ("alerts", "alerts"),
    ("rules", "rules"),
    ("review", "review"),
    ("analytics", "analytics"),
    ("sync", "sync"),
    ("etl", "etl"),
]

__all__: list[str] = []

for _attr, _mod_name in _ROUTER_MODULES:
    try:
        _mod: Any = importlib.import_module(f"app.api.v1.routers.{_mod_name}")
        globals()[_attr] = _mod
        __all__.append(_attr)
    except Exception as _exc:  # pragma: no cover
        logger.warning("Failed to import router %s: %s", _mod_name, _exc)
        # Create a dummy router so app.include_router won't crash
        from fastapi import APIRouter

        _dummy = APIRouter(prefix=f"/{_mod_name}", tags=[_mod_name])

        @_dummy.get("/__degraded__", include_in_schema=False)
        async def _degraded(mod: str = _mod_name, err: str = str(_exc)) -> dict:
            return {"code": 503, "message": f"router {mod} unavailable: {err}", "data": None}

        globals()[_attr] = type(_mod_name, (), {"router": _dummy})()
        __all__.append(_attr)
