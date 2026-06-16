import sys
sys.path.insert(0, '.')
from data.data_processor import data_processor
import plotly.express as px
import pandas as pd
from utils.style_config import RISK_COLORS

try:
    store_id = None
    risk_filter = ['已过期', '临期(30天内)', '近效期(90天内)']
    
    inventory_data = data_processor.get_batch_expiry_analysis(store_id)
    print('Step 1: Got inventory data, shape:', inventory_data.shape)
    
    if not inventory_data.empty and risk_filter:
        inventory_data = inventory_data[inventory_data['expiry_status'].isin(risk_filter)]
    print('Step 2: After filter, shape:', inventory_data.shape)
    
    if not inventory_data.empty:
        expiry_summary = inventory_data.groupby(['expiry_status', 'store_name']).agg({
            'inventory_id': 'count',
            'quantity': 'sum',
            'stock_value': 'sum'
        }).reset_index()
        print('Step 3: expiry_summary columns:', expiry_summary.columns.tolist())
        print('Step 3: expiry_summary sample:')
        print(expiry_summary.head())
        
        expiry_fig = px.bar(
            expiry_summary,
            x='store_name',
            y='inventory_id',
            color='expiry_status',
            color_discrete_map=RISK_COLORS,
            title='各门店风险批次数量'
        )
        print('Step 4: Created bar chart successfully!')
        
except Exception as e:
    import traceback
    traceback.print_exc()
