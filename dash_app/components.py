from datetime import date, timedelta
from dash import dcc, html, dash_table
import dash_bootstrap_components as dbc


def create_layout(active_page: str) -> html.Div:
    nav_items = [
        {"id": "overview", "name": "概览看板", "icon": "📊", "path": "/"},
        {"id": "capacity", "name": "时段容量", "icon": "📅", "path": "/capacity"},
        {"id": "conflicts", "name": "冲突检测", "icon": "⚠️", "path": "/conflicts"},
        {"id": "reschedule", "name": "改约口径", "icon": "🔄", "path": "/reschedule"},
        {"id": "reports", "name": "综合报表", "icon": "📈", "path": "/reports"},
    ]

    nav_links = []
    for item in nav_items:
        is_active = (active_page == item["id"])
        nav_links.append(
            html.Li([
                dcc.Link([
                    html.Span(item["icon"], className="nav-icon"),
                    html.Span(item["name"])
                ], href=item["path"], className="active" if is_active else "")
            ])
        )

    sidebar = html.Div([
        html.Div([
            html.H2("🏋️ 健身私教看板"),
            html.P("PT Appointment Dashboard")
        ], className="sidebar-brand"),
        html.Ul(nav_links, className="sidebar-nav")
    ], className="sidebar")

    return sidebar


def default_date_range(days: int = 30):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    return start_date.isoformat(), end_date.isoformat()


def create_filter_bar(
    start_date_default: str,
    end_date_default: str,
    region_options: list = None,
    extra_filters: list = None,
    show_compare: bool = True
) -> html.Div:
    region_options = region_options or []
    compare_options = [
        {"label": "不对比", "value": "none"},
        {"label": "环比上周", "value": "week"},
        {"label": "环比上月", "value": "month"},
        {"label": "同比去年", "value": "yoy"},
    ]

    filter_items = [
        html.Div([
            html.Label("开始日期"),
            dcc.DatePickerSingle(
                id="filter-start-date",
                date=start_date_default,
                display_format="YYYY-MM-DD",
                style={"width": "100%"}
            )
        ], className="filter-item"),

        html.Div([
            html.Label("结束日期"),
            dcc.DatePickerSingle(
                id="filter-end-date",
                date=end_date_default,
                display_format="YYYY-MM-DD",
                style={"width": "100%"}
            )
        ], className="filter-item"),

        html.Div([
            html.Label("门店区域"),
            dcc.Dropdown(
                id="filter-region",
                options=region_options,
                value=[r["value"] for r in region_options] if region_options else None,
                multi=True,
                placeholder="全部区域",
                clearable=True
            )
        ], className="filter-item"),
    ]

    if show_compare:
        filter_items.append(
            html.Div([
                html.Label("同环比对比"),
                dcc.Dropdown(
                    id="filter-compare-mode",
                    options=compare_options,
                    value="none",
                    clearable=False
                )
            ], className="filter-item")
        )

    if extra_filters:
        filter_items.extend(extra_filters)

    return html.Div([
        html.Div(filter_items, className="filter-row")
    ], className="filter-bar")


def create_stat_card(
    label: str,
    value,
    trend_value: float = None,
    trend_label: str = None,
    value_prefix: str = "",
    value_suffix: str = ""
) -> html.Div:
    trend_html = None
    if trend_value is not None:
        if trend_value > 0.1:
            trend_class = "up"
            trend_icon = "↑"
        elif trend_value < -0.1:
            trend_class = "down"
            trend_icon = "↓"
        else:
            trend_class = "flat"
            trend_icon = "→"
        trend_label = trend_label or "环比"
        trend_html = html.Div(
            f"{trend_icon} {abs(trend_value):.1f}% {trend_label}",
            className=f"stat-trend {trend_class}"
        )

    return html.Div([
        html.Div(label, className="stat-label"),
        html.Div(f"{value_prefix}{value}{value_suffix}", className="stat-value"),
        trend_html
    ], className="stat-card")


def create_data_table(
    df,
    id_prefix: str,
    page_size: int = 20,
    clickable: bool = False,
    hidden_cols: list = None
) -> dash_table.DataTable:
    from datetime import date, time, datetime
    hidden_cols = hidden_cols or []
    if df.empty:
        columns = []
        data = []
    else:
        columns = [
            {"name": col, "id": col, "hideable": True}
            for col in df.columns if col not in hidden_cols
        ]
        display_df = df.copy()
        for col in display_df.columns:
            display_df[col] = display_df[col].apply(
                lambda v: str(v) if isinstance(v, (date, time, datetime)) else ("" if v is None or (isinstance(v, float) and __import__('math').isnan(v)) else v)
            )
        data = display_df.to_dict("records")

    style = {"style_cell": {"textAlign": "left", "padding": "10px", "fontSize": "13px"}}
    if clickable:
        style["style_data"] = {"cursor": "pointer", "selector": "td"}
        style["style_data_conditional"] = [{
            "if": {"state": "active"},
            "backgroundColor": "#e3f2fd"
        }]

    return dash_table.DataTable(
        id=f"{id_prefix}-table",
        columns=columns,
        data=data,
        page_size=page_size,
        sort_action="native",
        filter_action="native",
        style_table={"overflowX": "auto"},
        style_header={
            "backgroundColor": "#fafafa",
            "fontWeight": "600",
            "textTransform": "uppercase",
            "fontSize": "11px",
            "letterSpacing": "0.3px",
            "color": "#757575",
            "borderBottom": "2px solid #e0e0e0"
        },
        **style
    )


def render_empty(message: str = "暂无数据") -> html.Div:
    return html.Div([
        html.Div("📭", className="empty-state-icon"),
        html.P(message)
    ], className="empty-state")


def status_badge(status: str) -> html.Span:
    badge_map = {
        "scheduled": ("badge-default", "已排期"),
        "completed": ("badge-success", "已完成"),
        "cancelled": ("badge-danger", "已取消"),
        "booked": ("badge-primary", "已预约"),
        "attended": ("badge-success", "已到场"),
        "no_show": ("badge-warning", "未到场"),
        "success": ("badge-success", "成功"),
        "failed": ("badge-danger", "失败"),
        "running": ("badge-info", "运行中"),
        "pending": ("badge-default", "待处理"),
    }
    cls, label = badge_map.get(status.lower(), ("badge-default", status))
    return html.Span(label, className=f"badge {cls}")
