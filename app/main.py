from __future__ import annotations

import streamlit as st
import yaml
import bcrypt

from app.config import settings
from app.services.duckdb_service import DuckDBService
from app.services.minio_service import MinIOService
from app.services.pipeline import DataPipeline
from app.services.auth_service import AuthService
from app.pages.overview import render as render_overview
from app.pages.followup import render as render_followup
from app.pages.analysis import render as render_analysis
from app.pages.prescription_annotate import render as render_prescription_annotate
from app.pages.member_detail import render as render_member_detail
from app.pages.data_import import render as render_data_import


st.set_page_config(
    page_title="药店连锁用药回访趋势看板",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="expanded",
)


def _hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))


def _verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def _init_services() -> tuple[DuckDBService, MinIOService | None, DataPipeline | None, AuthService, bool]:
    minio_available = True

    if "db" not in st.session_state:
        st.session_state.db = DuckDBService()

    if "minio_available" not in st.session_state:
        st.session_state.minio_available = True

    if "minio" not in st.session_state:
        try:
            st.session_state.minio = MinIOService()
        except Exception as e:
            st.warning(f"对象存储 (MinIO) 连接失败: {e}")
            st.session_state.minio = None
            st.session_state.minio_available = False
            minio_available = False

    if "pipeline" not in st.session_state:
        if st.session_state.minio is not None:
            st.session_state.pipeline = DataPipeline(st.session_state.minio, st.session_state.db)
        else:
            st.session_state.pipeline = None

    if "auth" not in st.session_state:
        st.session_state.auth = AuthService()

    return (
        st.session_state.db,
        st.session_state.minio,
        st.session_state.pipeline,
        st.session_state.auth,
        st.session_state.get("minio_available", True),
    )


def _authenticate() -> str | None:
    if "username" not in st.session_state:
        st.session_state.username = None

    if st.session_state.username:
        return st.session_state.username

    st.markdown("## 💊 药店连锁用药回访趋势看板")
    st.markdown("---")

    if not st.session_state.get("minio_available", True):
        st.error(
            "⚠️ 对象存储 (MinIO) 服务不可用。数据导入和批次回查功能将不可用，"
            "但您仍可查看已有数据。请联系管理员启动 MinIO 服务。"
        )
        st.markdown("---")

    with st.form("login_form"):
        username = st.text_input("用户名")
        password = st.text_input("密码", type="password")
        submitted = st.form_submit_button("登录")

        if submitted and username and password:
            try:
                with open(settings.streamlit_users_file, "r", encoding="utf-8") as f:
                    users = yaml.safe_load(f)
                creds = users.get("credentials", {})

                if username in creds:
                    stored_hash = creds[username].get("password", "")
                    if _verify_password(password, stored_hash):
                        st.session_state.username = username
                        st.session_state.role = creds[username].get("name", "staff")
                        st.rerun()
                    else:
                        st.error("用户名或密码错误")
                else:
                    st.error("用户名或密码错误")
            except Exception as e:
                st.error(f"登录失败: {e}")

    st.markdown("---")
    st.caption("演示账号: admin / pharmacist_a / pharmacist_b  (密码: demo123)")
    return None


def _render_sidebar(username: str, auth: AuthService, minio_available: bool) -> None:
    with st.sidebar:
        st.markdown(f"**当前用户**: {username}")
        role = auth.get_role(username)
        role_label = "管理员" if role == "admin" else "一线药师"
        st.markdown(f"**角色**: {role_label}")

        if not minio_available:
            st.error("⚠️ 对象存储不可用")

        if st.button("退出登录"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        st.markdown("---")
        st.caption("药店连锁用药回访趋势看板 v0.1")


def main() -> None:
    db, minio_svc, pipeline, auth, minio_available = _init_services()
    username = _authenticate()

    if not username:
        return

    _render_sidebar(username, auth, minio_available)

    if not minio_available:
        st.error(
            "⚠️ 对象存储 (MinIO) 服务不可用。数据导入和批次回查功能将被禁用。"
        )

    page_configs = _get_page_configs(auth, username, minio_available)

    if not page_configs:
        st.warning("当前账号无可用页面。")
        return

    page_names = [p["label"] for p in page_configs]
    selected = st.sidebar.radio("导航", page_names)

    page_map = {p["label"]: p["render"] for p in page_configs}
    render_fn = page_map.get(selected)
    if render_fn:
        if render_fn in (render_data_import,):
            render_fn(db, minio_svc, pipeline, auth, username)
        else:
            render_fn(db, auth, username)


def _get_page_configs(auth: AuthService, username: str, minio_available: bool = True) -> list[dict]:
    pages = []

    if auth.can_access_overview(username):
        pages.append({"label": "🏢 管理总览", "render": render_overview})

    if auth.can_access_followup(username):
        pages.append({"label": "🔄 用药回访", "render": render_followup})

    if auth.can_access_analysis(username):
        pages.append({"label": "📊 分析区", "render": render_analysis})

    if auth.can_annotate_prescription(username):
        pages.append({"label": "📝 处方注释", "render": render_prescription_annotate})

    pages.append({"label": "👤 会员档案", "render": render_member_detail})

    if auth.can_import_data(username) and minio_available:
        pages.append({"label": "📥 数据导入", "render": render_data_import})

    return pages


if __name__ == "__main__":
    main()
