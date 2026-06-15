import sys
import os
sys.path.insert(0, '/Users/yaoleyxing/Developer/solo-mange-pro/MP0173')

os.environ['DASH_DEBUG'] = 'False'

from app import app, server
from app.pages import create_main_layout, create_drilldown_layout
from app.callbacks import register_main_callbacks, register_drilldown_callbacks
from dash import Input, Output, State, html, dcc, callback_context, no_update

with server.app_context():
    main_layout = create_main_layout()
    drilldown_layout = create_drilldown_layout()

register_main_callbacks()
register_drilldown_callbacks()

@app.callback(Output("page-content", "children"), [Input("url", "pathname")])
def display_page(pathname):
    if pathname and pathname.startswith("/drilldown/"):
        return drilldown_layout
    return main_layout

@app.callback(
    Output("url", "pathname"),
    [
        Input("drilldown-btn", "n_clicks"),
        Input("students-table", "active_cell"),
        Input("back-to-main", "n_clicks"),
    ],
    [
        State("students-table", "derived_virtual_data"),
        State("students-table", "selected_rows"),
    ],
    prevent_initial_call=True,
)
def navigate_page(drilldown_clicks, active_cell, back_clicks, table_data, selected_rows):
    return "/"

app.layout = html.Div(
    [
        dcc.Location(id="url", refresh=False),
        dcc.Store(id="drilldown-grade-id", data=None),
        html.Div(id="page-content"),
    ]
)

print("=" * 60)
print("所有回调：")
print("=" * 60)

output_count = {}

for callback_id, callback_info in app.callback_map.items():
    print(f"\n回调: {callback_id}")
    
    outputs = callback_info.get('outputs', [])
    if not isinstance(outputs, list):
        outputs = [outputs]
    
    print("  输出:")
    for output in outputs:
        out_str = f"{output.component_id}.{output.component_property}"
        print(f"    - {out_str}")
        output_count[out_str] = output_count.get(out_str, 0) + 1

print("\n" + "=" * 60)
print("重复输出检查：")
print("=" * 60)

for out_str, count in output_count.items():
    if count > 1:
        print(f"❌ 重复: {out_str} ({count} 次)")
    else:
        print(f"✅ 正常: {out_str}")

print("\n完成！")
