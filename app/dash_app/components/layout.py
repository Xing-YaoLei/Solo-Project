from dash import html
import dash_bootstrap_components as dbc
from datetime import datetime

from app.models import RoleEnum
from app.auth import has_view_permission, can_view_amount
from .funnel import COLOR_PALETTE


def get_nav_items(user_role: RoleEnum):
    items = []
    if has_view_permission(user_role, "funnel"):
        items.append(dbc.NavItem(dbc.NavLink("🏠 漏斗概览", href="#funnel-section", external_link=True)))
    if has_view_permission(user_role, "reconciliation"):
        items.append(dbc.NavItem(dbc.NavLink("📊 对账差异", href="#recon-section", external_link=True)))
    if has_view_permission(user_role, "contract_attachment"):
        items.append(dbc.NavItem(dbc.NavLink("📎 合同附件", href="#attach-section", external_link=True)))
    if has_view_permission(user_role, "document_detail"):
        items.append(dbc.NavItem(dbc.NavLink("📝 单据明细", href="#doc-section", external_link=True)))
    if has_view_permission(user_role, "approval_abnormal"):
        items.append(dbc.NavItem(dbc.NavLink("⚖️ 审批异常", href="#approval-section", external_link=True)))
    if has_view_permission(user_role, "payment_cycle"):
        items.append(dbc.NavItem(dbc.NavLink("💰 回款周期", href="#payment-section", external_link=True)))
    return items


def build_navbar(user_role: RoleEnum, username: str, last_refresh_time,
                 is_refresh_running: bool = False):
    refresh_text = "刷新中..." if is_refresh_running else "手动刷新"
    refresh_spinner = dbc.Spinner(size="sm", color="light") if is_refresh_running else None

    last_refresh_display = "尚未刷新"
    if last_refresh_time:
        if isinstance(last_refresh_time, datetime):
            last_refresh_display = last_refresh_time.strftime("%Y-%m-%d %H:%M:%S")
        else:
            last_refresh_display = str(last_refresh_time)

    can_refresh = has_view_permission(user_role, "refresh")
    can_export = has_view_permission(user_role, "export")
    can_share = has_view_permission(user_role, "share_view")

    navbar = dbc.NavbarSimple(
        children=[
            html.Div([
                html.Span("🔄 ", className="me-1"),
                html.Span("最近刷新：", className="text-light small me-1"),
                html.Span(
                    last_refresh_display,
                    className="text-warning fw-bold small me-3",
                    id="last-refresh-time",
                    title="最近一次全量数据刷新完成时间"
                ),
                html.Span("|", className="text-light-50 mx-2 opacity-50"),
                html.Span("👤 ", className="me-1"),
                html.Span(username, className="text-light small me-1"),
                html.Span(f"[{user_role.value}]", className="text-info small me-3") if user_role else None,
            ], className="d-flex align-items-center me-4"),

            dbc.NavItem(dbc.DropdownMenu(
                label="📥 导入",
                nav=True,
                children=[
                    dbc.DropdownMenuItem("设计软件导出", id="btn-import-design", disabled=not has_view_permission(user_role, "import_data")),
                    dbc.DropdownMenuItem("采购单明细", id="btn-import-purchase", disabled=not has_view_permission(user_role, "import_data")),
                    dbc.DropdownMenuItem("监理照片", id="btn-import-photo", disabled=not has_view_permission(user_role, "import_data")),
                ] if has_view_permission(user_role, "import_data") else [
                    dbc.DropdownMenuItem("无权限导入", disabled=True)
                ],
                className="me-2"
            )),

            dbc.Button(
                [refresh_spinner, f" {refresh_text}"] if refresh_spinner else [refresh_text],
                id="btn-refresh",
                color="warning",
                outline=True,
                disabled=not can_refresh or is_refresh_running,
                size="sm",
                className="me-2"
            ),

            dbc.DropdownMenu(
                label="📤 导出",
                nav=True,
                children=[
                    dbc.DropdownMenuItem("导出完整报表（含回款口径）", id="btn-export-full", disabled=not can_export),
                    dbc.DropdownMenuItem("仅漏斗与对账", id="btn-export-summary", disabled=not can_export),
                    dbc.DropdownMenuItem("当前页面数据", id="btn-export-current", disabled=not can_export),
                ] if can_export else [
                    dbc.DropdownMenuItem("无权限导出", disabled=True)
                ],
                className="me-2"
            ),

            dbc.Button(
                "🔗 分享视图",
                id="btn-share-view",
                color="info",
                outline=True,
                size="sm",
                disabled=not can_share
            ),
        ],
        brand="🏗️ 家装工地量房报价漏斗报表",
        brand_href="#",
        color=COLOR_PALETTE['dark'],
        dark=True,
        className="mb-4 shadow sticky-top",
        expand="lg"
    )
    return navbar


def build_footer():
    return html.Footer(
        dbc.Container([
            html.Hr(),
            html.Div([
                html.Small("© 家装工地数据报表系统 | ", className="text-muted"),
                html.Small("数据来源：设计软件导出 · 监理系统照片 · ERP采购单 | ", className="text-muted"),
                html.Small("技术栈：Dash + Plotly + Pandas + PostgreSQL + Celery", className="text-muted"),
            ], className="text-center pb-3")
        ]),
        className="mt-5"
    )


def build_permission_banner(user_role: RoleEnum):
    if not can_view_amount(user_role):
        return dbc.Alert(
            [
                html.I(className="bi bi-shield-lock-fill me-2"),
                "当前角色【{}】无金额查看权限，所有金额字段已脱敏为 ***。如需查看，请联系管理员.".format(
                    user_role.value if user_role else "访客"
                )
            ],
            color="warning",
            className="mb-3",
            dismissable=True,
            is_open=True
        )
    return None
