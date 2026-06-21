import sys
sys.path.insert(0, '.')
from src.utils.analyzer import risk_analyzer
import plotly.graph_objects as go
from datetime import datetime, date

trend = risk_analyzer.get_daily_trend(30)

fig = go.Figure()
fig.add_trace(go.Scatter(
    x=trend['date'].to_list(),
    y=trend['submit_count'].to_list(),
    mode='lines+markers',
))

print('Testing add_shape with date object...')
try:
    fig.add_shape(
        type="line",
        x0=date(2026, 6, 10),
        x1=date(2026, 6, 10),
        y0=0,
        y1=1,
        yref="paper",
        line=dict(
            color="orange",
            width=2,
            dash="dash",
        ),
    )
    print('Success with add_shape and date object!')
except Exception as e:
    print(f'Error with add_shape and date object: {e}')
    import traceback
    traceback.print_exc()

print('\nTesting add_annotation with date object...')
try:
    fig.add_annotation(
        x=date(2026, 6, 10),
        y=1,
        yref="paper",
        text="数据延迟",
        showarrow=False,
        yshift=10,
        font=dict(color="orange"),
    )
    print('Success with add_annotation and date object!')
except Exception as e:
    print(f'Error with add_annotation and date object: {e}')
    import traceback
    traceback.print_exc()

print('\nAll tests done!')
