from typing import Any, Optional, Dict
from fastapi.encoders import jsonable_encoder


def success_response(data: Any = None, message: str = "操作成功", code: int = 200) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": jsonable_encoder(data) if data is not None else None,
    }


def error_response(message: str = "操作失败", code: int = 400, data: Any = None) -> Dict[str, Any]:
    return {
        "code": code,
        "message": message,
        "data": jsonable_encoder(data) if data is not None else None,
    }
