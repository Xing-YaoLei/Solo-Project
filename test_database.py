import sys
sys.path.insert(0, '.')
import os
os.makedirs('./data', exist_ok=True)

from src.storage.duckdb_client import DuckDBClient
from src.data_generator import MockDataGenerator
from src.analysis.anomaly_detection import AnomalyDetector
from src.analysis.metrics import MetricAnalyzer
from src.analysis.refund_analysis import RefundAnalyzer
from datetime import datetime, timedelta

print('='*50)
print('Testing database initialization...')
db = DuckDBClient('./data/test_vocational_edu.duckdb')
print('✅ Database initialized successfully')

print('='*50)
print('Testing data generation...')
generator = MockDataGenerator(db)
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

print('Generating employment records...')
emp_df = generator.generate_employment_records(start_date, end_date, 50)
print(f'✅ Generated {len(emp_df)} employment records')

print('Generating live platform logs...')
live_df = generator.generate_live_platform_logs(start_date, end_date, 100)
print(f'✅ Generated {len(live_df)} live platform logs')

print('Generating question bank records...')
qb_df = generator.generate_question_bank_records(start_date, end_date, 200)
print(f'✅ Generated {len(qb_df)} question bank records')

print('Generating account transactions...')
tx_df = generator.generate_account_transactions(start_date, end_date, 80)
print(f'✅ Generated {len(tx_df)} account transactions')

print('Generating level changes...')
level_df = generator.generate_level_changes(start_date, end_date, 50)
print(f'✅ Generated {len(level_df)} level changes')

print('Generating redemption records...')
red_df = generator.generate_redemption_records(start_date, end_date, 30)
print(f'✅ Generated {len(red_df)} redemption records')

print('Generating refund records...')
refund_df = generator.generate_refund_records(start_date, end_date, 25)
print(f'✅ Generated {len(refund_df)} refund records')

print('='*50)
print('Testing data queries...')

tables = [
    'employment_records', 'live_platform_logs', 'question_bank_records',
    'account_transactions', 'level_changes', 'redemption_records', 'refund_records'
]

for table in tables:
    count = db.query_to_polars(f'SELECT COUNT(*) as cnt FROM {table}')['cnt'][0]
    print(f'  {table}: {count} records')

print('='*50)
print('Testing anomaly detection...')
detector = AnomalyDetector(db)
risk_score = detector.get_overall_risk_score(30)
print(f'Risk scores: {risk_score}')

print('='*50)
print('Testing level gaps coloring...')
gaps_df = detector.get_data_gap_colored_level_changes(30)
print(f'Level changes with colors: {len(gaps_df)} records')
print(f'Columns: {gaps_df.columns}')
if len(gaps_df) > 0:
    print(f'Sample colors: {gaps_df["row_color"].unique().to_list()}')
    gap_count = gaps_df.filter(pl.col('has_data_gap') == True).shape[0]
    print(f'Rows with data gaps: {gap_count}')

print('='*50)
print('Testing metrics analysis...')
import polars as pl
metrics_analyzer = MetricAnalyzer()
tx_for_metrics = db.query_to_polars('SELECT transaction_date, amount, region FROM account_transactions')
if len(tx_for_metrics) > 0:
    yoy_mom_df = metrics_analyzer.calculate_yoy_mom(
        tx_for_metrics, 'transaction_date', 'amount', ['region']
    )
    print(f'YoY/MoM analysis: {len(yoy_mom_df)} records')
    print('Sample columns:', yoy_mom_df.columns[:10])

print('='*50)
print('Testing refund analysis...')
refund_analyzer = RefundAnalyzer(db)
refund_stats = refund_analyzer.get_refund_statistics(30)
print(f'Refund statistics: {refund_stats}')

refund_reasons = refund_analyzer.get_refund_reason_distribution(30)
print(f'Refund reason categories: {len(refund_reasons)}')

print('='*50)
print('Testing plagiarism detection...')
plagiarism_df = db.query_to_polars('SELECT * FROM plagiarism_samples')
print(f'Plagiarism samples: {len(plagiarism_df)} records')

print('='*50)
print('Testing exam pass rates...')
pass_rates_df = db.query_to_polars('SELECT * FROM exam_pass_rates')
print(f'Exam pass rates: {len(pass_rates_df)} records')

print('='*50)
print('🎉 All database tests passed!')
db.close()

# Clean up test database
os.remove('./data/test_vocational_edu.duckdb')
print('✅ Test database cleaned up')
print('='*50)
