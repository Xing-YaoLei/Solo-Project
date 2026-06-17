from typing import Dict, Any
from datetime import datetime
import pandas as pd
import io
import os
from ..config import settings

EXPORT_CALIBER_TEMPLATES = {
    "contracts": """
【数据口径说明】
1. 统计范围：所有合同，包含草稿、待审批、已审批、已完成、已作废等全部状态
2. 合同金额：签约金额，包含主合同及补充协议金额
3. 回款周期：从签约日期到最后一笔回款日期的天数
4. 统计时间：{export_time}
5. 导出人：{operator_name}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数
    """,
    "bills": """
【数据口径说明】
1. 统计范围：所有单据，包含量房单、报价单、材料单、人工费单等
2. 单据金额：单据明细实际金额合计，已扣除折扣
3. 已付金额：截至导出时间已实际到账金额
4. 未付金额：单据总金额减去已付金额
5. 统计时间：{export_time}
6. 导出人：{operator_name}
7. 数据来源：家装工地量房报价跟进台
8. 注意事项：金额单位为人民币元，保留2位小数
    """,
    "reconciliation": """
【数据口径说明】
1. 统计范围：所有对账差异记录
2. 差异金额：预期金额与实际金额的差额
3. 状态说明：待处理、处理中、已解决、已驳回
4. 处理时效：从创建时间到处理完成时间的小时数
5. 统计时间：{export_time}
6. 导出人：{operator_name}
7. 数据来源：家装工地量房报价跟进台
8. 注意事项：金额单位为人民币元，保留2位小数
    """,
    "exceptions": """
【数据口径说明】
1. 统计范围：所有异常单，包含金额不一致、审批超时、资料缺失等类型
2. 优先级：高/中/低，影响金额超过1万元自动标记为高优先级
3. 处理时效：从创建时间到关闭时间的小时数
4. 统计时间：{export_time}
5. 导出人：{operator_name}
6. 数据来源：家装工地量房报价跟进台
7. 注意事项：金额单位为人民币元，保留2位小数
    """,
}


def generate_export_caliber(export_type: str, operator_name: str = "系统") -> str:
    template = EXPORT_CALIBER_TEMPLATES.get(export_type, f"""
【数据口径说明】
1. 统计范围：{export_type}数据
2. 统计时间：{{export_time}}
3. 导出人：{{operator_name}}
4. 数据来源：家装工地量房报价跟进台
    """)
    return template.format(
        export_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        operator_name=operator_name,
    )


def create_excel_export(
    data: pd.DataFrame,
    sheet_name: str,
    export_type: str,
    operator_name: str = "系统",
    custom_caliber: str = None,
) -> bytes:
    caliber = custom_caliber or generate_export_caliber(export_type, operator_name)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        caliber_df = pd.DataFrame({"说明": [caliber]})
        caliber_df.to_excel(writer, sheet_name="数据口径", index=False)
        data.to_excel(writer, sheet_name=sheet_name, index=False)

        for sheet in writer.sheets.values():
            for column in sheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                sheet.column_dimensions[column_letter].width = adjusted_width

    output.seek(0)
    return output.getvalue()
