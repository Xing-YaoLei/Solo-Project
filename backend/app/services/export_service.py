import io
import pandas as pd
from datetime import datetime
from typing import Optional
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.funnel_service import get_funnel_data, get_funnel_timeout_intervals, CLOSURE_RULE


CLOSURE_RULE_DETAIL = [
    {"规则名称": "标准关闭时长", "说明": "客诉从创建到最终关闭的总时长", "公式": "T_关闭 = T_closed_at - T_created_at"},
    {"规则名称": "工作日计算", "说明": "去除周末和法定节假日，仅计算工作日时长", "公式": "T_工作 = Σ(T_工作日_end - T_工作日_start)"},
    {"规则名称": "首次响应时长", "说明": "客诉创建到客服首次响应的时间", "公式": "T_响应 = T_首次响应 - T_created_at"},
    {"规则名称": "阶段处理耗时", "说明": "客诉在各阶段的平均停留时长", "公式": "T_阶段 = Σ(T_离开 - T_进入) / N"},
]


async def export_funnel_report(
    session: AsyncSession,
    fmt: str = "xlsx",
    date_start: Optional[datetime] = None,
    date_end: Optional[datetime] = None,
) -> StreamingResponse:
    funnel_data = await get_funnel_data(session, date_start, date_end)
    timeout_intervals = get_funnel_timeout_intervals()

    funnel_rows = []
    for stage in funnel_data["funnel"]:
        funnel_rows.append({
            "阶段": stage["stage_name"],
            "排序": stage["stage_order"],
            "客诉数量": stage["complaint_count"],
            "平均处理时长(h)": stage["avg_duration_hours"],
            "转化率": stage["conversion_rate"],
        })

    timeout_rows = []
    for item in timeout_intervals:
        timeout_rows.append({
            "起始(h)": item["start_date"],
            "截止(h)": item["end_date"],
            "平均时长(h)": item["avg_duration_hours"],
            "受影响阶段": ",".join(item["affected_stages"]),
            "数量": item["count"],
        })

    summary_rows = [{
        "总客诉数": funnel_data["total"],
        "平均关闭工作时长(h)": funnel_data["avg_closure_work_hours"],
        "关闭时长计算规则": CLOSURE_RULE,
    }]

    if fmt == "csv":
        combined_rows = []
        for row in funnel_rows:
            combined_rows.append({"类型": "漏斗数据", **row})
        for row in timeout_rows:
            combined_rows.append({"类型": "超时区间", **row})
        for row in summary_rows:
            combined_rows.append({"类型": "汇总", **row})
        for row in CLOSURE_RULE_DETAIL:
            combined_rows.append({"类型": "关闭时长规则", **row})

        df = pd.DataFrame(combined_rows)
        output = io.StringIO()
        df.to_csv(output, index=False, encoding="utf-8-sig")
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8-sig")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=funnel_report.csv"},
        )

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(funnel_rows).to_excel(writer, sheet_name="漏斗数据", index=False)
        pd.DataFrame(timeout_rows).to_excel(writer, sheet_name="超时区间", index=False)
        pd.DataFrame(summary_rows).to_excel(writer, sheet_name="汇总", index=False)
        pd.DataFrame(CLOSURE_RULE_DETAIL).to_excel(writer, sheet_name="关闭时长规则", index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=funnel_report.xlsx"},
    )
