from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import hashlib
import secrets
import uuid
from flask import current_app, request

from app.models import (
    db, User, Case, Client, ShareLink, ShareLinkView
)
from config import Config


class AuthService:
    @staticmethod
    def get_user_permissions(user: User) -> Dict[str, Any]:
        role = user.role
        return Config.ROLE_PERMISSIONS.get(role, {})

    @staticmethod
    def can_view_finance(user: User) -> bool:
        perms = AuthService.get_user_permissions(user)
        return perms.get('can_view_finance', False)

    @staticmethod
    def can_export(user: User) -> bool:
        perms = AuthService.get_user_permissions(user)
        return perms.get('can_export', False)

    @staticmethod
    def can_share(user: User) -> bool:
        perms = AuthService.get_user_permissions(user)
        return perms.get('can_share', False)

    @staticmethod
    def can_view_all_clients(user: User) -> bool:
        perms = AuthService.get_user_permissions(user)
        return perms.get('can_view_all_clients', False)

    @staticmethod
    def can_access_case(user: User, case: Case) -> bool:
        role = user.role
        perms = Config.ROLE_PERMISSIONS.get(role, {})
        scope = perms.get('scope', 'assigned')

        if scope in ('all', 'all_readonly'):
            return True
        elif scope == 'department':
            if not user.department:
                return False
            lawyer = User.query.get(case.responsible_lawyer_id)
            return lawyer and lawyer.department == user.department
        elif scope in ('team', 'assigned'):
            if case.responsible_lawyer_id == user.id:
                return True
            if case.assistant_lawyer_ids and user.id in case.assistant_lawyer_ids:
                return True
            return False
        elif scope == 'own_cases':
            return case.client_id == user.id
        return False

    @staticmethod
    def can_access_client(user: User, client: Client) -> bool:
        role = user.role
        perms = Config.ROLE_PERMISSIONS.get(role, {})
        scope = perms.get('scope', 'assigned')

        if scope in ('all', 'all_readonly'):
            return True
        elif scope == 'department':
            if not user.department:
                return False
            case_count = Case.query.join(User, Case.responsible_lawyer_id == User.id).filter(
                Case.client_id == client.id,
                User.department == user.department
            ).count()
            return case_count > 0
        elif scope in ('team', 'assigned'):
            case_count = Case.query.filter(
                Case.client_id == client.id,
                Case.responsible_lawyer_id == user.id
            ).count()
            return case_count > 0
        elif scope == 'own_cases':
            return client.id == user.id
        return False


class ShareLinkService:
    TOKEN_LENGTH = 48

    @staticmethod
    def generate_token() -> str:
        raw = f"{uuid.uuid4().hex}{secrets.token_hex(16)}{datetime.utcnow().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:ShareLinkService.TOKEN_LENGTH]

    @staticmethod
    def create_share_link(
        creator: User,
        link_type: str = 'case',
        case_id: Optional[str] = None,
        client_id: Optional[str] = None,
        role_scope: str = 'client',
        can_view_finance: bool = False,
        can_download: bool = True,
        ttl_hours: Optional[int] = None,
        max_views: Optional[int] = None,
        notes: Optional[str] = None
    ) -> ShareLink:
        if not AuthService.can_share(creator):
            raise PermissionError("当前用户无权创建分享链接")

        if case_id and not AuthService.can_access_case(creator, Case.query.get(case_id)):
            raise PermissionError("无权分享该案件")
        if client_id and not AuthService.can_access_client(creator, Client.query.get(client_id)):
            raise PermissionError("无权分享该客户")

        ttl = ttl_hours or Config.SHARE_LINK_TTL_HOURS
        token = ShareLinkService.generate_token()

        link = ShareLink(
            token=token,
            link_type=link_type,
            case_id=case_id,
            client_id=client_id,
            created_by=creator.id,
            role_scope=role_scope,
            can_view_finance=can_view_finance,
            can_download=can_download,
            expires_at=datetime.utcnow() + timedelta(hours=ttl),
            max_views=max_views,
            notes=notes
        )
        db.session.add(link)
        db.session.commit()
        return link

    @staticmethod
    def validate_share_link(token: str) -> Optional[ShareLink]:
        link = ShareLink.query.filter_by(token=token).first()
        if not link:
            return None
        if not link.is_valid():
            return None
        return link

    @staticmethod
    def record_view(link: ShareLink) -> None:
        link.view_count += 1
        viewer_ip = request.remote_addr if request else None
        viewer_ua = str(request.user_agent)[:500] if request and request.user_agent else None
        view = ShareLinkView(
            share_link_id=link.id,
            viewer_ip=viewer_ip,
            viewer_ua=viewer_ua
        )
        db.session.add(view)
        db.session.commit()

    @staticmethod
    def revoke_share_link(token: str, revoker: User) -> bool:
        link = ShareLink.query.filter_by(token=token).first()
        if not link:
            return False
        link.revoked_at = datetime.utcnow()
        link.revoked_by = revoker.id
        db.session.commit()
        return True

    @staticmethod
    def get_share_link_context(link: ShareLink) -> Dict[str, Any]:
        context = {
            'share_token': link.token,
            'link_type': link.link_type,
            'role_scope': link.role_scope,
            'can_view_finance': link.can_view_finance,
            'can_download': link.can_download,
            'expires_at': link.expires_at.isoformat(),
            'case_id': None,
            'case_number': None,
            'case_name': None,
            'client_id': None,
            'client_name': None,
            'filters': {}
        }
        if link.case_id:
            case = Case.query.get(link.case_id)
            if case:
                context['case_id'] = case.id
                context['case_number'] = case.case_number
                context['case_name'] = case.case_name
                context['client_id'] = case.client_id
                context['filters']['case_id'] = [case.id]
        if link.client_id:
            client = Client.query.get(link.client_id)
            if client:
                context['client_id'] = client.id
                context['client_name'] = client.name
                case_ids = Case.query.filter_by(client_id=client.id).with_entities(Case.id).all()
                context['filters']['case_id'] = [c[0] for c in case_ids]
                context['filters']['client_id'] = [client.id]
        return context

    @staticmethod
    def list_user_share_links(user: User) -> List[ShareLink]:
        query = ShareLink.query
        if user.role in ('admin', 'auditor'):
            return query.order_by(ShareLink.created_at.desc()).all()
        else:
            return query.filter_by(created_by=user.id).order_by(ShareLink.created_at.desc()).all()


class VirtualUser:
    def __init__(self, role_scope: str, share_context: Dict[str, Any]):
        self.id = f"virtual_{role_scope}_{share_context['share_token'][:8]}"
        self.role = role_scope
        self.department = None
        self.username = f"guest_{role_scope}"
        self.full_name = f"访客({role_scope})"
        self.email = ""
        self._share_context = share_context

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return self.id

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'username': self.username,
            'full_name': self.full_name,
            'is_virtual': True,
            'share_token': self._share_context['share_token']
        }
