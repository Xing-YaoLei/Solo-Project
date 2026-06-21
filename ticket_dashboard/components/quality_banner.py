import dash_bootstrap_components as dbc
from dash import html, dcc


def create_quality_banner():
    return dbc.Alert(
        id="quality-banner",
        children=[
            html.Div(id="quality-banner-content", children="数据质量检查中..."),
        ],
        color="warning",
        dismissable=True,
        is_open=False,
        style={"marginBottom": "12px"},
    )


def create_quality_flag_badges(flags):
    badge_items = []

    camera_flags = [f for f in flags if f.get("flag_type") == "camera_delay"]
    merchant_flags = [f for f in flags if f.get("flag_type") == "merchant_gap"]
    gate_flags = [f for f in flags if f.get("flag_type") == "gate_caliber_change"]

    if camera_flags:
        max_delay = max(f.get("delay_seconds", 0) for f in camera_flags)
        badge_items.append(
            dbc.Badge(
                f"摄像头统计延迟 {max_delay:.0f}s",
                color="danger",
                className="me-1",
            )
        )

    if merchant_flags:
        max_gap = max(f.get("max_gap_minutes", 0) for f in merchant_flags)
        channels = ", ".join(set(f.get("channel", "") for f in merchant_flags))
        badge_items.append(
            dbc.Badge(
                f"商户流水缺失 {max_gap:.0f}min（{channels}）",
                color="warning",
                className="me-1",
            )
        )

    if gate_flags:
        max_change = max(abs(f.get("change_ratio", 0)) for f in gate_flags)
        badge_items.append(
            dbc.Badge(
                f"闸机口径变化 {max_change:.1%}",
                color="info",
                className="me-1",
            )
        )

    if not badge_items:
        badge_items.append(
            dbc.Badge("数据质量正常", color="success", className="me-1")
        )

    return html.Span(badge_items)
