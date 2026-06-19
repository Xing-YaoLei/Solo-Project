from datetime import date, datetime
from typing import Dict, Any, Optional, List, Tuple
import uuid
import pandas as pd
import json

from dash import Input, Output, State, callback, ctx, no_update, dcc, html
import dash_bootstrap_components as dbc
from dash.exceptions import PreventUpdate

from data.queries import (
    get_all_properties, get_room_status_calendar, get_ota_orders,
    get_payment_transactions, get_door_lock_records, get_cleaning_tasks,
    calculate_occupancy_rate, get_available_channels, get_data_anomalies,
    add_note, get_notes
)
from utils.exporter import export_occupancy_report
from app.components.calendar_view import (
    create_heatmap_figure, render_orders_table,
    render_cleaning_table, render_raw_data
)
from app.components.trend_charts import (
    create_occupancy_trend_chart, create_channel_pie_chart,
    create_anomaly_bar_chart, create_anomaly_severity_chart
)
try:
    from tasks.sync_tasks import (
        sync_ota_orders, sync_payment_transactions,
        sync_door_lock_records, run_full_sync,
        run_local_full_sync as _run_local_sync, ensure_demo_properties
    )
    CELERY_AVAILABLE = True
except Exception as e:
    sync_ota_orders = None
    sync_payment_transactions = None
    sync_door_lock_records = None
    run_full_sync = None
    CELERY_AVAILABLE = False
    try:
        from tasks.sync_tasks import (
            run_local_full_sync as _run_local_sync, ensure_demo_properties
        )
    except Exception:
        _run_local_sync = None
        ensure_demo_properties = None


_selected_context: Dict[str, Any] = {}


def parse_date(s) -> Optional[date]:
    if s is None:
        return None
    if isinstance(s, date):
        return s
    try:
        return datetime.strptime(str(s)[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def register_callbacks(app):

    @callback(
        Output("property-dropdown", "options"),
        Output("channel-dropdown", "options"),
        Input("refresh-btn", "n_clicks"),
        Input({"type": "initial-load", "index": "main"}, "n_intervals")
    )
    def init_dropdowns(n_clicks, _initial):
        try:
            props_df = get_all_properties()
            prop_options = []
            if not props_df.empty:
                prop_options = [
                    {"label": f"{row['property_code']} - {row['property_name']}", "value": str(row["id"])}
                    for _, row in props_df.iterrows()
                ]

            channels = get_available_channels()
            channel_options = [{"label": c, "value": c} for c in channels]

            return prop_options, channel_options
        except Exception as e:
            print(f"初始化下拉选项失败: {e}")
            return [], []

    @callback(
        Output("kpi-total-properties", "children"),
        Output("kpi-total-properties-sub", "children"),
        Output("kpi-occupancy-rate", "children"),
        Output("kpi-occupancy-rate-sub", "children"),
        Output("kpi-confirmed-orders", "children"),
        Output("kpi-confirmed-orders-sub", "children"),
        Output("kpi-conflicts", "children"),
        Output("kpi-conflicts-sub", "children"),
        Output("room-status-heatmap", "figure"),
        Output("occupancy-trend-chart", "figure"),
        Output("channel-pie-chart", "figure"),
        Output("anomaly-bar-chart", "figure"),
        Output("anomaly-severity-chart", "figure"),
        Input("refresh-btn", "n_clicks"),
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("property-dropdown", "value"),
        Input("channel-dropdown", "value"),
        Input("group-by-dropdown", "value"),
        Input("show-anomaly-switch", "value"),
        Input("show-conflict-only-switch", "value"),
        State({"type": "initial-load", "index": "main"}, "n_intervals")
    )
    def update_all_charts(
        n_clicks, start_date_str, end_date_str,
        property_ids, channels, group_by,
        show_anomaly, conflict_only, _initial
    ):
        triggered = ctx.triggered_id
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)

        if not start_date or not end_date:
            raise PreventUpdate

        try:
            props_df = get_all_properties()
            total_props = len(props_df) if not props_df.empty else 0

            occupancy_df = calculate_occupancy_rate(start_date, end_date, property_ids, group_by)
            avg_rate = round(occupancy_df["occupancy_rate"].mean(), 2) if not occupancy_df.empty else 0.0
            total_conflicts = int(occupancy_df["conflict_count"].sum()) if not occupancy_df.empty else 0

            orders_df = get_ota_orders(start_date, end_date, property_ids, channels, include_anomaly=show_anomaly)
            confirmed_orders = len(orders_df[
                orders_df["order_status"].isin(["已确认", "已入住", "已完成"])
            ]) if not orders_df.empty else 0

            calendar_df = get_room_status_calendar(start_date, end_date, property_ids)
            if conflict_only and not calendar_df.empty:
                calendar_df = calendar_df[calendar_df["has_conflict"] == True]

            calendar_fig = create_heatmap_figure(calendar_df, start_date, end_date)
            trend_fig = create_occupancy_trend_chart(occupancy_df, group_by)
            channel_fig = create_channel_pie_chart(orders_df)

            anomaly_df = get_data_anomalies()
            anomaly_bar_fig = create_anomaly_bar_chart(anomaly_df)
            anomaly_severity_fig = create_anomaly_severity_chart(anomaly_df)

            return (
                str(total_props),
                f"共 {total_props} 个活跃房源",
                f"{avg_rate}%",
                f"{group_by_map(group_by)}统计平均",
                str(confirmed_orders),
                f"已确认/已入住/已完成",
                str(total_conflicts),
                f"需要立即处理",
                calendar_fig,
                trend_fig,
                channel_fig,
                anomaly_bar_fig,
                anomaly_severity_fig
            )

        except Exception as e:
            print(f"更新视图失败: {e}")
            raise PreventUpdate

    @callback(
        Output("detail-modal", "is_open"),
        Output("detail-modal-title", "children"),
        Output("orders-detail-content", "children"),
        Output("cleaning-detail-content", "children"),
        Output("raw-detail-content", "children"),
        Input("room-status-heatmap", "clickData"),
        Input("close-detail-modal", "n_clicks"),
        State("date-range-picker", "start_date"),
        State("date-range-picker", "end_date"),
        prevent_initial_call=True
    )
    def handle_calendar_click(click_data, close_clicks, start_date_str, end_date_str):
        triggered = ctx.triggered_id

        if triggered == "close-detail-modal":
            return False, no_update, no_update, no_update, no_update

        if not click_data or "points" not in click_data or not click_data["points"]:
            raise PreventUpdate

        point = click_data["points"][0]
        custom_data = point.get("customdata", {})
        if not custom_data:
            raise PreventUpdate

        property_name = custom_data.get("property_name", "未知房源")
        selected_date_str = custom_data.get("date")
        property_id = custom_data.get("property_id")
        has_conflict = custom_data.get("has_conflict", False)

        _selected_context.update({
            "entity_type": "room_status",
            "property_id": property_id,
            "property_name": property_name,
            "date": selected_date_str
        })

        selected_date = parse_date(selected_date_str)
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)

        pids = [property_id] if property_id else None

        orders_df = get_ota_orders(start_date or selected_date, end_date or selected_date, pids)
        if not orders_df.empty and selected_date:
            orders_df = orders_df[
                (orders_df["check_in_date"] <= selected_date) &
                (orders_df["check_out_date"] > selected_date)
            ]
        orders_content = render_orders_table(orders_df)

        cleaning_df = get_cleaning_tasks(selected_date, selected_date, pids)
        cleaning_content = render_cleaning_table(cleaning_df)

        raw_dfs = []
        if not orders_df.empty:
            raw_orders = orders_df.copy()
            if "raw_data" in raw_orders.columns:
                raw_dfs.append(("OTA订单原始样本", raw_orders[["order_no", "raw_data"]]))

        payments_df = get_payment_transactions(
            datetime.combine(selected_date, datetime.min.time()) if selected_date else None,
            datetime.combine(selected_date, datetime.max.time()) if selected_date else None,
            pids
        )
        if not payments_df.empty and "raw_data" in payments_df.columns:
            raw_dfs.append(("收款流水原始样本", payments_df[["transaction_no", "raw_data"]]))

        door_locks_df = get_door_lock_records(
            datetime.combine(selected_date, datetime.min.time()) if selected_date else None,
            datetime.combine(selected_date, datetime.max.time()) if selected_date else None,
            pids
        )
        if not door_locks_df.empty and "raw_data" in door_locks_df.columns:
            raw_dfs.append(("门锁记录原始样本", door_locks_df[["record_no", "raw_data"]]))

        raw_contents = []
        if not raw_dfs:
            raw_contents.append(html.Div("暂无原始样本数据", className="text-muted text-center py-4"))
        else:
            for title, rdf in raw_dfs:
                raw_contents.extend(render_raw_data(rdf, title))

        conflict_suffix = " (⚠ 房态冲突)" if has_conflict else ""
        modal_title = f"{property_name} - {selected_date_str}{conflict_suffix}"

        return True, modal_title, orders_content, cleaning_content, raw_contents

    @callback(
        Output("legend-container", "style"),
        Input("legend-toggle-btn", "n_clicks"),
        State("legend-container", "style"),
        prevent_initial_call=True
    )
    def toggle_legend(n_clicks, current_style):
        if current_style and current_style.get("display") == "none":
            return {"display": "block"}
        return {"display": "none"}

    @callback(
        Output("note-modal", "is_open"),
        Output("note-content-input", "value"),
        Output("note-author-input", "value"),
        Input("calendar-note-btn", "n_clicks"),
        Input("trend-note-btn", "n_clicks"),
        Input("channel-note-btn", "n_clicks"),
        Input("anomaly-note-btn", "n_clicks"),
        Input("add-note-btn", "n_clicks"),
        Input("close-note-modal", "n_clicks"),
        Input("save-note-btn", "n_clicks"),
        prevent_initial_call=True
    )
    def handle_note_modal(cal_note, trend_note, ch_note, anom_note, add_note, close_note, save_note):
        triggered = ctx.triggered_id

        if triggered in ["close-note-modal", "save-note-btn"]:
            return False, "", ""

        if triggered == "calendar-note-btn":
            _selected_context["entity_type"] = "calendar_overview"
        elif triggered == "trend-note-btn":
            _selected_context["entity_type"] = "occupancy_trend"
        elif triggered == "channel-note-btn":
            _selected_context["entity_type"] = "channel_distribution"
        elif triggered == "anomaly-note-btn":
            _selected_context["entity_type"] = "data_quality"
        elif triggered == "add-note-btn":
            pass

        return True, "", ""

    @callback(
        Output("note-save-toast", "children", allow_duplicate=True),
        Output("note-save-toast", "header", allow_duplicate=True),
        Output("note-save-toast", "icon", allow_duplicate=True),
        Output("note-save-toast", "is_open", allow_duplicate=True),
        Input("save-note-btn", "n_clicks"),
        State("note-content-input", "value"),
        State("note-author-input", "value"),
        prevent_initial_call=True
    )
    def save_note(n_clicks, content, author):
        if not content or not content.strip():
            return "备注内容不能为空", "保存失败", "danger", True

        entity_type = _selected_context.get("entity_type", "general")
        entity_id = _selected_context.get("property_id") or _selected_context.get("date") or str(uuid.uuid4())

        try:
            add_note(entity_type, str(entity_id), content.strip(), author or "system")
            return "备注保存成功", "操作成功", "success", True
        except Exception as e:
            return f"保存失败: {str(e)}", "错误", "danger", True

    @callback(
        Output("export-download", "data"),
        Output("export-toast", "children", allow_duplicate=True),
        Output("export-toast", "header", allow_duplicate=True),
        Output("export-toast", "icon", allow_duplicate=True),
        Output("export-toast", "is_open", allow_duplicate=True),
        Input("export-btn", "n_clicks"),
        State("date-range-picker", "start_date"),
        State("date-range-picker", "end_date"),
        State("property-dropdown", "value"),
        State("channel-dropdown", "value"),
        State("group-by-dropdown", "value"),
        prevent_initial_call=True
    )
    def handle_export(n_clicks, start_str, end_str, property_ids, channels, group_by):
        if not n_clicks:
            raise PreventUpdate

        start_date = parse_date(start_str)
        end_date = parse_date(end_str)

        if not start_date or not end_date:
            return no_update, "请先选择日期范围", "导出失败", "warning", True

        try:
            filter_desc_parts = []
            if property_ids:
                filter_desc_parts.append(f"房源{len(property_ids)}个")
            if channels:
                filter_desc_parts.append(f"渠道:{','.join(channels)}")
            filter_desc = ";".join(filter_desc_parts) if filter_desc_parts else None

            filepath = export_occupancy_report(
                start_date=start_date,
                end_date=end_date,
                property_ids=property_ids,
                group_by=group_by,
                channels=channels,
                filter_description=filter_desc
            )

            return dcc.send_file(str(filepath)), f"报表已导出: {filepath.name}", "导出成功", "success", True

        except Exception as e:
            print(f"导出失败: {e}")
            return no_update, f"导出失败: {str(e)}", "错误", "danger", True


def group_by_map(group_by: str) -> str:
    return {"day": "按天", "week": "按周", "month": "按月"}.get(group_by, "")


@callback(
    Output("sync-toast", "children", allow_duplicate=True),
    Output("sync-toast", "header", allow_duplicate=True),
    Output("sync-toast", "icon", allow_duplicate=True),
    Output("sync-toast", "is_open", allow_duplicate=True),
    Input("menu-sync-ota", "n_clicks"),
    Input("menu-sync-payment", "n_clicks"),
    Input("menu-sync-lock", "n_clicks"),
    Input("menu-sync-all", "n_clicks"),
    prevent_initial_call=True
)
def handle_sync_menu(ota_clicks, pay_clicks, lock_clicks, all_clicks):
    triggered = ctx.triggered_id

    task_map = {
        "menu-sync-ota": ("OTA订单同步", sync_ota_orders),
        "menu-sync-payment": ("收款流水同步", sync_payment_transactions),
        "menu-sync-lock": ("门锁记录同步", sync_door_lock_records),
        "menu-sync-all": ("全量数据同步", None)
    }

    sync_name, task_func = task_map.get(triggered, (None, None))

    if not sync_name:
        raise PreventUpdate

    if not CELERY_AVAILABLE:
        return "Celery服务未连接，请确保Redis和Celery Worker已启动", "同步不可用", "warning", True

    try:
        if triggered == "menu-sync-all":
            result = run_full_sync.delay()
            toast_msg = f"全量同步任务已提交，任务组ID: {str(result.task_id)[:8]}..."
        else:
            result = task_func.delay()
            toast_msg = f"{sync_name}任务已提交，任务ID: {str(result.task_id)[:8]}..."

        return toast_msg, "同步任务已启动", "success", True
    except Exception as e:
        return f"启动同步失败: {str(e)}", "错误", "danger", True


@callback(
    Output("sync-toast", "children", allow_duplicate=True),
    Output("sync-toast", "header", allow_duplicate=True),
    Output("sync-toast", "icon", allow_duplicate=True),
    Output("sync-toast", "is_open", allow_duplicate=True),
    Output("property-dropdown", "options", allow_duplicate=True),
    Output("channel-dropdown", "options", allow_duplicate=True),
    Output("kpi-total-properties", "children", allow_duplicate=True),
    Output("kpi-total-properties-sub", "children", allow_duplicate=True),
    Output("kpi-occupancy-rate", "children", allow_duplicate=True),
    Output("kpi-occupancy-rate-sub", "children", allow_duplicate=True),
    Output("kpi-confirmed-orders", "children", allow_duplicate=True),
    Output("kpi-confirmed-orders-sub", "children", allow_duplicate=True),
    Output("kpi-conflicts", "children", allow_duplicate=True),
    Output("kpi-conflicts-sub", "children", allow_duplicate=True),
    Output("room-status-heatmap", "figure", allow_duplicate=True),
    Output("occupancy-trend-chart", "figure", allow_duplicate=True),
    Output("channel-pie-chart", "figure", allow_duplicate=True),
    Output("anomaly-bar-chart", "figure", allow_duplicate=True),
    Output("anomaly-severity-chart", "figure", allow_duplicate=True),
    Input("init-demo-btn", "n_clicks"),
    State("date-range-picker", "start_date"),
    State("date-range-picker", "end_date"),
    State("property-dropdown", "value"),
    State("channel-dropdown", "value"),
    State("group-by-dropdown", "value"),
    prevent_initial_call=True
)
def handle_init_demo(n_clicks, start_str, end_str, property_ids, channels, group_by):
    if not n_clicks:
        raise PreventUpdate

    if not _run_local_sync:
        return (
            "本地同步函数加载失败，请检查tasks/sync_tasks.py",
            "初始化失败", "danger", True,
            *[no_update] * 15
        )

    try:
        from data.queries import (
            get_all_properties, get_available_channels, calculate_occupancy_rate,
            get_room_status_calendar, get_ota_orders, get_data_anomalies
        )
        from app.components.kpi_cards import generate_kpi_subtitle
        from datetime import date

        results = _run_local_sync()

        summary_parts = []
        for k, v in results.items():
            if isinstance(v, dict):
                if "error" in v:
                    summary_parts.append(f"{k}:❌")
                elif "records_processed" in v:
                    summary_parts.append(f"{k[0]}:{v['records_processed']}条")
            elif v == "completed":
                summary_parts.append(f"{k[0].upper()}:✅")
        summary = " | ".join(summary_parts) if summary_parts else "完成"

        props_df = get_all_properties()
        prop_options = []
        if not props_df.empty:
            prop_options = [
                {"label": f"{row['property_code']} - {row['property_name']}", "value": str(row["id"])}
                for _, row in props_df.iterrows()
            ]
        channels_list = get_available_channels()
        channel_options = [{"label": c, "value": c} for c in channels_list]

        start_date = parse_date(start_str)
        end_date = parse_date(end_str)
        if not start_date:
            start_date = date.today()
        if not end_date:
            end_date = date.today()

        try:
            total_occ, avg_occ, total_room_nights, total_conflicts = calculate_occupancy_rate(
                start_date, end_date, property_ids
            )
            prop_count = len(property_ids) if property_ids else len(props_df)
            kpi_props = f"{prop_count} 套", generate_kpi_subtitle("房源总数", prop_count)
            kpi_occ = f"{avg_occ * 100:.1f}%", generate_kpi_subtitle("平均入住率", avg_occ, is_pct=True,
                                                                     reference=(date.today() - start_date).days + 1)
            kpi_orders_val = f"{total_room_nights:,}", generate_kpi_subtitle("间夜数", total_room_nights)
            kpi_conflicts_val = f"{total_conflicts} 个", generate_kpi_subtitle("房态冲突", total_conflicts)
        except Exception as e:
            print(f"KPI计算失败: {e}")
            kpi_props = ("-", "")
            kpi_occ = ("-", "")
            kpi_orders_val = ("-", "")
            kpi_conflicts_val = ("-", "")

        try:
            calendar_df = get_room_status_calendar(start_date, end_date, property_ids)
            fig_heatmap = create_heatmap_figure(calendar_df)
        except Exception as e:
            print(f"热力图失败: {e}")
            fig_heatmap = no_update

        try:
            orders_df = get_ota_orders(start_date, end_date, property_ids, channels)
            fig_trend = create_occupancy_trend_chart(orders_df, calendar_df, group_by)
            fig_pie = create_channel_pie_chart(orders_df)
        except Exception as e:
            print(f"趋势/渠道图失败: {e}")
            fig_trend = no_update
            fig_pie = no_update

        try:
            anomalies_df = get_data_anomalies(start_date, end_date, property_ids)
            fig_anomaly = create_anomaly_bar_chart(anomalies_df)
            fig_severity = create_anomaly_severity_chart(anomalies_df)
        except Exception as e:
            print(f"异常图失败: {e}")
            fig_anomaly = no_update
            fig_severity = no_update

        return (
            f"演示数据初始化完成：{summary}，看板已刷新",
            "初始化成功", "success", True,
            prop_options, channel_options,
            kpi_props[0], kpi_props[1],
            kpi_occ[0], kpi_occ[1],
            kpi_orders_val[0], kpi_orders_val[1],
            kpi_conflicts_val[0], kpi_conflicts_val[1],
            fig_heatmap, fig_trend, fig_pie, fig_anomaly, fig_severity
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return (
            f"初始化演示数据失败: {str(e)}",
            "错误", "danger", True,
            *[no_update] * 15
        )


@callback(
    Output("sync-toast", "children", allow_duplicate=True),
    Output("sync-toast", "header", allow_duplicate=True),
    Output("sync-toast", "icon", allow_duplicate=True),
    Output("sync-toast", "is_open", allow_duplicate=True),
    Input({"type": "initial-load", "index": "main"}, "n_intervals"),
    prevent_initial_call='initial_duplicate'
)
def auto_check_first_launch(_initial):
    try:
        from data.queries import get_all_properties
        props_df = get_all_properties()
        if props_df.empty:
            return (
                "首次启动暂无数据！请点击左上角【初始化演示数据】按钮生成完整的可下钻数据，包含OTA订单、收款流水、门锁记录、房态日历和保洁任务。",
                "欢迎使用民宿房态看板", "info", True
            )
    except Exception:
        pass
    raise PreventUpdate
