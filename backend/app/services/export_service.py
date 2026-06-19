import io
import pandas as pd
from datetime import datetime
from typing import Optional
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.funnel_service import get_funnel_data, get_funnel_timeout_intervals, CLOSURE_RULE


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
            "转化率": stage["conversion_rate"],
        })

    timeout_rows = []
    for item in timeout_intervals:
        timeout_rows.append({
            "超时区间": item["interval"],
            "数量": item["count"],
        })

    summary_rows = [{
        "总客诉数": funnel_data["total"],
        "平均关闭工作时长(h)": funnel_data["avg_closure_work_hours"],
        "关闭时长计算规则": CLOSURE_RULE,
    }]

    if fmt == "csv":
        df = pd.DataFrame(funnel_rows)
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
        pd.DataFrame(summary_rows).to_excel(writer, sheet_name="汇总与规则", index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=funnel_report.xlsx"},
    )
