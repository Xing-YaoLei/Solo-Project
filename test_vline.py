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

print('Testing add_vline with date object...')
try:
    fig.add_vline(
        x=date(2026, 6, 10),
        line_dash='dash',
        line_color='orange',
        annotation_text='测试',
        annotation_position='top',
    )
    print('Success with date object!')
except Exception as e:
    print(f'Error with date object: {e}')
    import traceback
    traceback.print_exc()

print('\nTesting add_vline with datetime object...')
try:
    fig.add_vline(
        x=datetime(2026, 6, 10),
        line_dash='dash',
        line_color='red',
        annotation_text='测试2',
        annotation_position='top',
    )
    print('Success with datetime object!')
except Exception as e:
    print(f'Error with datetime object: {e}')
    import traceback
    traceback.print_exc()

print('\nTesting add_vline with string...')
try:
    fig.add_vline(
        x='2026-06-15',
        line_dash='dash',
        line_color='green',
        annotation_text='测试3',
        annotation_position='top',
    )
    print('Success with string!')
except Exception as e:
    print(f'Error with string: {e}')
    import traceback
    traceback.print_exc()

print('\nAll tests done!')
