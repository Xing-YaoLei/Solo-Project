"""护理达标计算规则

本文件定义了护理达标的计算标准，在数据下载时会自动附加到结果文件中。
"""

COMPLIANCE_RULES = {
    "计算方法": "护理达标率 = (达标活动次数 / 应完成活动总次数) × 100%",
    "达标判定标准": {
        "康复活动": [
            "活动按时开始（延迟不超过15分钟）",
            "老人实际参与（签到确认）",
            "活动内容符合护理计划",
            "有完整的活动记录"
        ],
        "日常护理": [
            "每日护理项目完成率100%",
            "护理操作符合规范要求",
            "老人无异常反应或已妥善处理"
        ]
    },
    "权重分配": {
        "康复活动参与率": 0.4,
        "护理操作规范率": 0.3,
        "健康监测完成率": 0.2,
        "风险事件发生率": 0.1
    },
    "数据来源": [
        "护理终端签到数据",
        "健康设备监测数据",
        "收费系统服务记录",
        "人工录入的异常事件"
    ],
    "异常排除规则": [
        "老人请假期间的活动不计入统计",
        "医生建议暂停的康复活动不计入统计",
        "设备故障期间的数据已标注说明",
        "系统切换期间的口径变化已单独说明"
    ],
    "阈值说明": {
        "优秀": "≥ 95%",
        "良好": "85% - 94%",
        "合格": "70% - 84%",
        "待改进": "< 70%"
    }
}


def get_compliance_rules_text() -> str:
    """获取格式化的护理达标计算规则文本"""
    lines = ["=" * 60]
    lines.append("护理达标计算规则说明")
    lines.append("=" * 60)
    lines.append("")
    
    lines.append(f"【计算方法】")
    lines.append(f"  {COMPLIANCE_RULES['计算方法']}")
    lines.append("")
    
    lines.append(f"【达标判定标准】")
    for category, rules in COMPLIANCE_RULES["达标判定标准"].items():
        lines.append(f"  {category}：")
        for rule in rules:
            lines.append(f"    • {rule}")
    lines.append("")
    
    lines.append(f"【权重分配】")
    for item, weight in COMPLIANCE_RULES["权重分配"].items():
        lines.append(f"  • {item}：{int(weight * 100)}%")
    lines.append("")
    
    lines.append(f"【数据来源】")
    for source in COMPLIANCE_RULES["数据来源"]:
        lines.append(f"  • {source}")
    lines.append("")
    
    lines.append(f"【异常排除规则】")
    for rule in COMPLIANCE_RULES["异常排除规则"]:
        lines.append(f"  • {rule}")
    lines.append("")
    
    lines.append(f"【阈值说明】")
    for level, range_ in COMPLIANCE_RULES["阈值说明"].items():
        lines.append(f"  • {level}：{range_}")
    lines.append("")
    lines.append("=" * 60)
    
    return "\n".join(lines)
