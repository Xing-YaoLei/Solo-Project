from app.config import engine
import pandas as pd

df = pd.read_sql('''
SELECT 
    date, zone, time_slot,
    reservation_count, reminder_sent, checked_in,
    in_zone, consumed,
    camera_total_flow, merchant_total_visitors, merchant_total_amount,
    remark
FROM reservation_funnel 
WHERE date = (SELECT MAX(date) FROM reservation_funnel)
ORDER BY zone, time_slot
LIMIT 6
''', engine)
pd.set_option('display.width', 240)
pd.set_option('display.max_columns', None)
print(df.to_string())
print()
print('=== 汇总 ===')
summary = pd.read_sql('''
SELECT 
    date,
    SUM(reservation_count) resv,
    SUM(reminder_sent) rem,
    SUM(checked_in) chk,
    SUM(in_zone) inz,
    SUM(consumed) cons,
    SUM(camera_total_flow) cam,
    SUM(merchant_total_visitors) mvis,
    SUM(merchant_total_amount) mamt,
    ROUND(SUM(in_zone)*100.0/SUM(checked_in),1) as inz_rate_pct,
    ROUND(SUM(consumed)*100.0/SUM(checked_in),1) as cons_rate_pct
FROM reservation_funnel 
WHERE date = (SELECT MAX(date) FROM reservation_funnel)
GROUP BY date
''', engine)
print(summary.to_string())
print()
print('=== 核心验证：漏斗阶段必须严格收敛 ===')
print(f'  预约({summary.resv.iloc[0]}) >= 提醒({summary.rem.iloc[0]}) >= 检票({summary.chk.iloc[0]}) >= 到区域({summary.inz.iloc[0]}) >= 关联消费({summary.cons.iloc[0]})')
print(f'  独立指标（非漏斗）：摄像头客流={summary.cam.iloc[0]}, 商户总客流={summary.mvis.iloc[0]}, 商户总金额={summary.mamt.iloc[0]}')
print(f'  到区域/检票 = {summary.inz_rate_pct.iloc[0]}%（入口90%/其他78% 估算）')
print(f'  关联消费/检票 = {summary.cons_rate_pct.iloc[0]}%（仅统计有预约关联的订单）')
print(f'  商户总客流 vs 关联消费人数 = {summary.mvis.iloc[0]} vs {summary.cons.iloc[0]}（散客未计入漏斗）')
