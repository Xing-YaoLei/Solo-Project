import sys
sys.path.insert(0, '/Users/yaoleyxing/Developer/solo-mange-pro/MP0235')

from data.data_processor import DataProcessor
from datetime import datetime, timedelta

data_processor = DataProcessor()

end_date = datetime.now().date()
start_date = end_date - timedelta(days=90)

print("=== get_task_with_conclusions columns ===")
tasks = data_processor.get_task_with_conclusions(start_date, end_date)
print(tasks.columns.tolist())
print("\n=== tasks sample ===")
print(tasks.head())

print("\n=== get_followup_records columns ===")
followup_data = data_processor.loader.get_followup_records()
print(followup_data.columns.tolist())
print("\n=== followup_data sample ===")
print(followup_data.head())

print("\n=== get_followup_performance columns ===")
daily_perf = data_processor.get_followup_performance(start_date, end_date)
print(daily_perf.columns.tolist())

print("\n=== get_followup_by_operator columns ===")
operator_perf = data_processor.get_followup_by_operator(start_date, end_date)
print(operator_perf.columns.tolist())
