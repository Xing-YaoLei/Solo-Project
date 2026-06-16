import sys
sys.path.insert(0, '.')
from data.data_processor import data_processor
import plotly.express as px
import pandas as pd
from utils.style_config import RISK_COLORS
from utils.helpers import format_date, safe_df_to_records

try:
    store_id = None
    risk_filter = ['已过期', '临期(30天内)', '近效期(90天内)']
    
    print('=== Step 1: get_batch_expiry_analysis ===')
    inventory_data = data_processor.get_batch_expiry_analysis(store_id)
    print('Columns:', inventory_data.columns.tolist())
    print('Has days_to_expiry:', 'days_to_expiry' in inventory_data.columns)
    print('Shape:', inventory_data.shape)
    
    print('\n=== Step 2: Filter ===')
    if not inventory_data.empty and risk_filter:
        print('Before filter shape:', inventory_data.shape)
        inventory_data = inventory_data[inventory_data['expiry_status'].isin(risk_filter)]
        print('After filter shape:', inventory_data.shape)
    
    print('\n=== Step 3: Display cols ===')
    display_cols = ['batch_no', 'drug_name', 'specification', 'store_name', 'quantity',
                    'expiry_date', 'days_to_expiry', 'expiry_status', 'stock_value']
    
    for col in display_cols:
        print(f'  {col}: {col in inventory_data.columns}')
    
    print('\n=== Step 4: Select columns ===')
    display_data = inventory_data[display_cols].copy()
    print('Selected columns:', display_data.columns.tolist())
    
    print('\n=== Step 5: Sort ===')
    display_data = display_data.sort_values('days_to_expiry')
    print('Sorted successfully')
    
    print('\n=== Step 6: Rename columns ===')
    display_data.columns = ['批号', '药品名称', '规格', '门店', '库存数量',
                            '有效期', '距到期天数', '风险等级', '库存价值']
    print('Renamed columns:', display_data.columns.tolist())
    
    print('\n=== Step 7: Format ===')
    display_data['有效期'] = display_data['有效期'].apply(format_date)
    display_data['库存价值'] = display_data['库存价值'].apply(lambda x: f'¥{x:,.2f}')
    print('Formatted successfully')
    
    print('\n=== Step 8: Create table data ===')
    table_data = safe_df_to_records(display_data)
    table_columns = [
        {'name': col, 'id': col, 'selectable': True}
        for col in display_data.columns
    ]
    print('Success! Table columns:', [c['name'] for c in table_columns])
    
except Exception as e:
    import traceback
    traceback.print_exc()
