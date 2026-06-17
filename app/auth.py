from functools import wraps
from flask_login import current_user
from app.database import get_session
from app.models import UserScope, Property, Contract


class PermissionDenied(Exception):
    pass


def is_manager(user):
    return user.role in ('admin', 'manager', 'director')


def is_frontline(user):
    return user.role in ('frontline', 'agent')


def get_user_scopes(user_id, scope_type=None):
    with get_session() as session:
        query = session.query(UserScope).filter(UserScope.user_id == user_id)
        if scope_type:
            query = query.filter(UserScope.scope_type == scope_type)
        scopes = query.all()
        return [(s.scope_type, s.scope_value) for s in scopes]


def get_allowed_projects(user_id):
    scopes = get_user_scopes(user_id, 'project')
    return [v for _, v in scopes]


def get_allowed_districts(user_id):
    scopes = get_user_scopes(user_id, 'district')
    return [v for _, v in scopes]


def get_managed_property_ids(user_id):
    with get_session() as session:
        properties = session.query(Property).filter(
            Property.manager_id == user_id
        ).all()
        return [p.property_id for p in properties]


def apply_scope_filter(query, model, user):
    if is_manager(user):
        return query

    allowed_projects = get_allowed_projects(user.id)
    allowed_districts = get_allowed_districts(user.id)
    managed_ids = get_managed_property_ids(user.id)

    if model == Property:
        if allowed_projects:
            query = query.filter(model.project_name.in_(allowed_projects))
        if allowed_districts:
            query = query.filter(model.district.in_(allowed_districts))
        if managed_ids:
            query = query.filter(model.property_id.in_(managed_ids))
    elif model == Contract:
        if allowed_projects or allowed_districts or managed_ids:
            from app.models import Property as P
            subq = session.query(P.property_id)
            if allowed_projects:
                subq = subq.filter(P.project_name.in_(allowed_projects))
            if allowed_districts:
                subq = subq.filter(P.district.in_(allowed_districts))
            if managed_ids:
                subq = subq.filter(P.property_id.in_(managed_ids))
            allowed_prop_ids = [r[0] for r in subq.all()]
            query = query.filter(model.property_id.in_(allowed_prop_ids))

    return query


def require_role(*roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated:
                raise PermissionDenied('请先登录')
            if current_user.role not in roles:
                raise PermissionDenied('权限不足')
            return func(*args, **kwargs)
        return wrapper
    return decorator
