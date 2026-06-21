import io
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import polars as pl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
)

from app.config.settings import settings
from app.schemas.export import ExportFormat
from app.utils.payment_cycle import get_payment_cycle_description


def ensure_export_dir() -> Path:
    export_dir = Path(settings.EXPORT_DIR)
    export_dir.mkdir(parents=True, exist_ok=True)
    return export_dir


def generate_filename(
    export_type: str,
    format: ExportFormat,
    timestamp: datetime | None = None,
) -> str:
    timestamp = timestamp or datetime.now()
    ext_map = {
        ExportFormat.EXCEL: "xlsx",
        ExportFormat.CSV: "csv",
        ExportFormat.PDF: "pdf",
        ExportFormat.PARQUET: "parquet",
    }
    return f"{export_type}_{timestamp.strftime('%Y%m%d_%H%M%S')}.{ext_map[format]}"


def _get_payment_cycle_sheet_data() -> list[list[str]]:
    description = get_payment_cycle_description()
    lines = description.strip().split("\n")
    return [[line] for line in lines]


def add_payment_cycle_sheet(writer: pd.ExcelWriter) -> None:
    description = get_payment_cycle_description()
    lines = description.strip().split("\n")

    wb = writer.book
    ws = wb.create_sheet("回款周期口径说明", 0)

    ws.merge_cells("A1:E1")
    title_cell = ws["A1"]
    title_cell.value = "回款周期口径说明"
    title_cell.font = Font(size=16, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    header_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
    header_font = Font(bold=True)

    ws["A3"] = "周期类型"
    ws["B3"] = "统计周期"
    ws["C3"] = "适用场景"
    ws["D3"] = "说明"

    for col in range(1, 5):
        cell = ws.cell(row=3, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    cycle_data = [
        ["月度回款", "每月1日至当月最后一天", "常规月度对账", "按自然月统计回款金额"],
        ["季度回款", "每季度首月1日至季度末", "季度业绩考核", "按自然季度统计回款金额"],
        ["半年度回款", "1月1日-6月30日，7月1日-12月31日", "半年度总结报告", "按半年统计回款金额"],
        ["年度回款", "每年1月1日至12月31日", "年度财务审计", "按自然年统计回款金额"],
        ["里程碑回款", "根据合同约定的里程碑日期", "大型项目阶段性回款", "按项目里程碑节点统计"],
    ]

    for row_idx, row_data in enumerate(cycle_data, start=4):
        for col_idx, value in enumerate(row_data, start=1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.value = value
            cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

    note_row = len(cycle_data) + 6
    ws.cell(row=note_row, column=1, value="注意事项：").font = Font(bold=True)

    notes = [
        "1. 实际回款日期以款项到账日期为准",
        "2. 逾期款项按实际回款日期计入对应周期",
        "3. 预收款按合同约定的服务期间分摊",
    ]

    for i, note in enumerate(notes, start=1):
        ws.cell(row=note_row + i, column=1, value=note)

    ws.column_dimensions["A"].width = 15
    ws.column_dimensions["B"].width = 30
    ws.column_dimensions["C"].width = 25
    ws.column_dimensions["D"].width = 40


def add_watermark_to_pdf(c: canvas.Canvas, doc: Any) -> None:
    page_width, page_height = A4

    c.saveState()
    c.translate(page_width / 2, page_height / 2)
    c.rotate(45)

    c.setFillGray(0.9, 0.3)

    watermark_text = getattr(settings, "PDF_WATERMARK_TEXT", "CONFIDENTIAL")
    user_info = getattr(doc, "_user_info", "")
    timestamp = getattr(doc, "_export_timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    full_watermark = f"{watermark_text} - {user_info} - {timestamp}"

    c.setFont("Helvetica-Bold", 60)
    c.drawCentredString(0, 0, full_watermark)

    c.restoreState()

    c.saveState()
    c.setFont("Helvetica", 8)
    c.setFillGray(0.5)
    c.drawString(0.5 * inch, 0.5 * inch, f"导出时间: {timestamp}")
    if user_info:
        c.drawString(0.5 * inch, 0.7 * inch, f"导出用户: {user_info}")
    c.restoreState()


def export_to_excel(
    data: dict[str, list[dict[str, Any]]],
    output_path: str,
    include_payment_cycle: bool = True,
) -> int:
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        if include_payment_cycle:
            add_payment_cycle_sheet(writer)

        for sheet_name, records in data.items():
            if not records:
                continue

            df = pd.DataFrame(records)

            column_mapping: dict[str, str] = {
                "id": "ID",
                "case_no": "案件编号",
                "name": "名称",
                "case_type": "案件类型",
                "status": "状态",
                "quoted_amount": "报价金额",
                "actual_amount": "实际金额",
                "invoice_no": "发票编号",
                "amount": "金额",
                "invoice_date": "开票日期",
                "source": "来源",
                "phase": "期次",
                "phase_name": "期次名称",
                "due_date": "到期日",
                "actual_payment_date": "实际付款日",
                "payment_cycle_type": "回款周期",
                "created_at": "创建时间",
                "updated_at": "更新时间",
            }

            df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

            df.to_excel(writer, sheet_name=sheet_name, index=False)

            wb = writer.book
            ws = wb[sheet_name]

            header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
            header_font = Font(bold=True, color="FFFFFF")

            for cell in ws[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")

            for column in ws.columns:
                max_length = 0
                column_letter = get_column_letter(column[0].column)
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except Exception:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width

    return os.path.getsize(output_path)


def export_to_csv(
    data: list[dict[str, Any]],
    output_path: str,
) -> int:
    df = pd.DataFrame(data)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    return os.path.getsize(output_path)


def export_to_parquet(
    data: list[dict[str, Any]],
    output_path: str,
) -> int:
    df = pl.DataFrame(data)
    df.write_parquet(output_path)
    return os.path.getsize(output_path)


def export_to_pdf(
    data: dict[str, list[dict[str, Any]]],
    output_path: str,
    title: str = "Export Report",
    user_info: str = "",
    include_payment_cycle: bool = True,
) -> int:
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    doc._user_info = user_info
    doc._export_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    styles = getSampleStyleSheet()
    elements: list[Any] = []

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=20,
        spaceAfter=30,
        textColor=colors.HexColor("#2563eb"),
    )
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 12))

    if include_payment_cycle:
        elements.append(Paragraph("回款周期口径说明", styles["Heading2"]))
        elements.append(Spacer(1, 12))

        description = get_payment_cycle_description()
        desc_style = ParagraphStyle(
            "Description",
            parent=styles["BodyText"],
            fontSize=10,
            leading=14,
        )

        for line in description.strip().split("\n"):
            if line.strip():
                elements.append(Paragraph(line.replace(" ", "&nbsp;"), desc_style))
            else:
                elements.append(Spacer(1, 6))

        elements.append(Spacer(1, 20))
        elements.append(PageBreak())

    for sheet_name, records in data.items():
        if not records:
            continue

        elements.append(Paragraph(sheet_name, styles["Heading2"]))
        elements.append(Spacer(1, 12))

        df = pd.DataFrame(records)

        column_mapping: dict[str, str] = {
            "id": "ID",
            "case_no": "案件编号",
            "name": "名称",
            "case_type": "案件类型",
            "status": "状态",
            "quoted_amount": "报价金额",
            "actual_amount": "实际金额",
            "invoice_no": "发票编号",
            "amount": "金额",
            "invoice_date": "开票日期",
            "source": "来源",
            "phase": "期次",
            "phase_name": "期次名称",
            "due_date": "到期日",
            "actual_payment_date": "实际付款日",
            "payment_cycle_type": "回款周期",
            "created_at": "创建时间",
            "updated_at": "更新时间",
        }

        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

        max_columns = 8
        if len(df.columns) > max_columns:
            table_data = [df.columns.tolist()[:max_columns]]
            for _, row in df.head(50).iterrows():
                table_data.append([str(v) for v in row.tolist()[:max_columns]])
        else:
            table_data = [df.columns.tolist()] + df.astype(str).values.tolist()

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("ALIGN", (0, 1), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        if len(df) > 50:
            elements.append(Paragraph(
                f"<i>注：仅显示前50条记录，完整数据请查看Excel版本</i>",
                styles["Italic"]
            ))
            elements.append(Spacer(1, 20))

    def on_page(c: canvas.Canvas, doc: Any) -> None:
        add_watermark_to_pdf(c, doc)

    doc.build(elements, onFirstPage=on_page, onLaterPages=on_page)
    return os.path.getsize(output_path)


def export_data(
    data: dict[str, list[dict[str, Any]]],
    export_type: str,
    format: ExportFormat,
    user_info: str = "",
    include_payment_cycle: bool = True,
) -> tuple[str, int]:
    ensure_export_dir()
    filename = generate_filename(export_type, format)
    output_path = str(ensure_export_dir() / filename)

    if format == ExportFormat.EXCEL:
        size = export_to_excel(data, output_path, include_payment_cycle)
    elif format == ExportFormat.CSV:
        first_key = next(iter(data.keys()))
        size = export_to_csv(data[first_key], output_path)
    elif format == ExportFormat.PARQUET:
        first_key = next(iter(data.keys()))
        size = export_to_parquet(data[first_key], output_path)
    elif format == ExportFormat.PDF:
        size = export_to_pdf(
            data,
            output_path,
            title=f"{export_type} Report",
            user_info=user_info,
            include_payment_cycle=include_payment_cycle,
        )
    else:
        raise ValueError(f"Unsupported export format: {format}")

    return output_path, size
