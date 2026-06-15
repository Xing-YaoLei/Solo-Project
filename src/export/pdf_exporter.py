import polars as pl
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfgen import canvas
from typing import Dict, Optional
from datetime import datetime
from io import BytesIO
from src.utils.filters import generate_filter_description, generate_filter_metadata
from config import setup_logger

logger = setup_logger()


class WatermarkCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self.watermark_text = kwargs.pop("watermark_text", "")
        self.filter_text = kwargs.pop("filter_text", "")
        super().__init__(*args, **kwargs)

    def showPage(self):
        self.setFont("STSong-Light", 6)
        self.setFillColor(colors.grey)
        self.drawRightString(
            self._pagesize[0] - 2 * cm,
            1.5 * cm,
            f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        self.drawString(
            2 * cm,
            1.5 * cm,
            f"筛选条件: {self.filter_text[:60]}..."
        )
        super().showPage()


class PDFExporter:
    def __init__(self):
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.cidfonts import UnicodeCIDFont
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            "CustomTitle",
            parent=self.styles["Heading1"],
            fontName="STSong-Light",
            fontSize=16,
            textColor=colors.HexColor("#1E3A8A"),
            spaceAfter=20,
            alignment=TA_CENTER,
        )
        self.subtitle_style = ParagraphStyle(
            "CustomSubtitle",
            parent=self.styles["Normal"],
            fontName="STSong-Light",
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=10,
            alignment=TA_LEFT,
        )
        self.header_style = ParagraphStyle(
            "TableHeader",
            parent=self.styles["Normal"],
            fontName="STSong-Light",
            fontSize=10,
            textColor=colors.white,
            alignment=TA_CENTER,
        )
        self.cell_style = ParagraphStyle(
            "TableCell",
            parent=self.styles["Normal"],
            fontName="STSong-Light",
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
        )

    def export_to_pdf(
        self,
        data: pl.DataFrame,
        filters: Optional[Dict] = None,
        title: str = "教材订购数据导出",
        orientation: str = "landscape"
    ) -> bytes:
        page_size = landscape(A4) if orientation == "landscape" else A4

        output = BytesIO()

        filter_desc = generate_filter_description(filters)
        metadata = generate_filter_metadata(filters)

        def create_watermark_canvas(*args, **kwargs):
            kwargs["watermark_text"] = title
            kwargs["filter_text"] = filter_desc
            return WatermarkCanvas(*args, **kwargs)

        doc = SimpleDocTemplate(
            output,
            pagesize=page_size,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            canvasmaker=create_watermark_canvas,
        )

        elements = []

        elements.append(Paragraph(title, self.title_style))
        elements.append(Spacer(1, 0.3 * cm))

        info_text = f"""
        <b>筛选条件:</b> {filter_desc}<br/>
        <b>导出时间:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>数据量:</b> {len(data)} 条记录<br/>
        <b>取数标识:</b> {self._generate_identifier(metadata)}
        """
        elements.append(Paragraph(info_text, self.subtitle_style))
        elements.append(Spacer(1, 0.5 * cm))

        table_data = self._prepare_table_data(data)
        col_widths = self._calculate_col_widths(data, page_size[0] - 4 * cm)

        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(self._get_table_style())

        elements.append(KeepTogether([table]))

        doc.build(elements)
        output.seek(0)

        logger.info(f"成功生成PDF文件，包含{len(data)}条记录")
        return output.getvalue()

    def _prepare_table_data(self, data: pl.DataFrame):
        headers = [Paragraph(col, self.header_style) for col in data.columns]
        table_data = [headers]

        for row in data.to_dicts():
            row_data = []
            for col in data.columns:
                value = row.get(col, "")
                if value is None:
                    value = "-"
                row_data.append(Paragraph(str(value), self.cell_style))
            table_data.append(row_data)

        return table_data

    def _calculate_col_widths(self, data: pl.DataFrame, total_width: float):
        num_cols = len(data.columns)
        if num_cols == 0:
            return []

        base_width = total_width / num_cols
        widths = []

        for col in data.columns:
            if col in ["textbook_name", "course_name", "publisher", "dept_name"]:
                widths.append(base_width * 1.5)
            elif col in ["order_id", "course_id", "student_id"]:
                widths.append(base_width * 1.2)
            elif col in ["quantity", "price", "amount", "score"]:
                widths.append(base_width * 0.7)
            elif col in ["status", "severity", "order_status"]:
                widths.append(base_width * 0.8)
            elif col in ["created_at", "updated_at", "trans_time", "approval_time"]:
                widths.append(base_width * 1.3)
            else:
                widths.append(base_width)

        total_calculated = sum(widths)
        if total_calculated != total_width:
            scale_factor = total_width / total_calculated
            widths = [w * scale_factor for w in widths]

        return widths

    def _get_table_style(self):
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ])

    def _generate_identifier(self, metadata: Dict) -> str:
        import hashlib
        import json
        filter_str = json.dumps(metadata["filters"], sort_keys=True, ensure_ascii=False)
        hash_val = hashlib.md5(filter_str.encode("utf-8")).hexdigest()[:8]
        return f"{datetime.now().strftime('%Y%m%d')}_{hash_val}"


pdf_exporter = PDFExporter()
