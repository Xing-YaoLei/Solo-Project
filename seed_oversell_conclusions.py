import sys
sys.path.insert(0, '.')

from src.utils.config import load_config
from src.data_layer.data_repository import DataRepository
import random
from datetime import datetime, timedelta

config = load_config()
repo = DataRepository(config, use_minio=False)

oversells = repo.get_oversell_records()
print(f"共有 {len(oversells)} 条超卖记录")

handlers = ["张三", "李四", "王五", "赵六", "运营团队"]
results = [
    "已协调客户升级到更高级别房型，客户满意无投诉",
    "协调至同区域合作酒店入住，承担额外费用150元/间",
    "客户选择退款补偿，赔付订单金额的30%作为违约金",
    "调整后续日期库存，为客户重新安排入住，赠送早餐券",
    "通过渠道协商，引导客户改期，给予9折优惠下次使用",
    "安排免费接机服务，升级景观房作为补偿",
    "客户同意更换套餐类型，差价由我方承担",
    "联系周边民宿安置，承担交通接驳费用",
]

count_resolved = 0
count_processing = 0

for i, row in enumerate(oversells.iter_rows(named=True)):
    oversell_id = row["oversell_id"]
    status = row["status"]
    current_result = row.get("handling_result")
    
    if current_result:
        count_resolved += 1
        continue
    
    if i < int(len(oversells) * 0.7):
        handler = random.choice(handlers)
        result = random.choice(results)
        remark_options = [
            "客户情绪稳定，处理顺利",
            "后续需关注该渠道的订单释放速度",
            "建议增加该日期的库存预警阈值",
            "复盘发现：OTA渠道库存同步延迟2小时",
            "该房型旺季需增加15%的安全库存",
        ]
        remark = random.choice(remark_options)
        
        repo.update_oversell_status(
            oversell_id=oversell_id,
            status="resolved",
            handler=handler,
            handling_result=result,
            remark=remark,
        )
        count_resolved += 1
    elif i < int(len(oversells) * 0.85):
        repo.update_oversell_status(
            oversell_id=oversell_id,
            status="processing",
            handler=random.choice(handlers),
            handling_result=None,
            remark="处理中，正在联系客户",
        )
        count_processing += 1

print(f"处理完成:")
print(f"  - 已解决: {count_resolved} 条")
print(f"  - 处理中: {count_processing} 条")
print(f"  - 待处理: {len(oversells) - count_resolved - count_processing} 条")

repo.close()
print("\n✅ 超卖处理结论已填充完成！")
