from ..schemas import ResponseModel, PaginatedResponse


def orm_to_dict(obj):
    if obj is None:
        return None
    if isinstance(obj, list):
        return [orm_to_dict(item) for item in obj]
    if isinstance(obj, dict):
        return {k: orm_to_dict(v) for k, v in obj.items()}
    
    if hasattr(obj, '__table__'):
        result = {}
        for column in obj.__table__.columns:
            value = getattr(obj, column.name)
            if hasattr(value, 'value'):
                result[column.name] = value.value
            else:
                result[column.name] = value
        return result
    
    return obj


def success_response(data=None, message: str = "success"):
    return ResponseModel(code=0, message=message, data=orm_to_dict(data))


def paginated_response(data, total: int, page: int, page_size: int, message: str = "success"):
    return PaginatedResponse(
        code=0,
        message=message,
        data=orm_to_dict(data),
        total=total,
        page=page,
        page_size=page_size
    )


def error_response(code: int = -1, message: str = "error", data=None):
    return ResponseModel(code=code, message=message, data=orm_to_dict(data))
