import polars as pl
from typing import Optional, Dict, Tuple
from datetime import datetime
from src.data.minio_client import minio_client
from src.export.excel_exporter import excel_exporter
from src.export.pdf_exporter import pdf_exporter
from src.utils.filters import generate_filter_metadata, serialize_filters
from config import setup_logger

logger = setup_logger()


class ExportService:
    def __init__(self):
        self.excel = excel_exporter
        self.pdf = pdf_exporter
        self.storage = minio_client

    def export_textbooks(
        self,
        data: pl.DataFrame,
        filters: Optional[Dict] = None,
        format: str = "excel",
        save_to_storage: bool = True
    ) -> Tuple[bytes, str, str]:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filter_suffix = serialize_filters(filters)
        if filter_suffix:
            filter_suffix = f"_{filter_suffix}"

        if format == "excel":
            file_data = self.excel.export_to_excel(
                data=data,
                filters=filters,
                sheet_name="教材清单",
                title="高校教材订购清单"
            )
            file_name = f"教材清单_{timestamp}{filter_suffix}.xlsx"
            mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif format == "pdf":
            file_data = self.pdf.export_to_pdf(
                data=data,
                filters=filters,
                title="高校教材订购清单"
            )
            file_name = f"教材清单_{timestamp}{filter_suffix}.pdf"
            mime_type = "application/pdf"
        else:
            raise ValueError(f"不支持的导出格式: {format}")

        storage_path = None
        if save_to_storage:
            metadata = generate_filter_metadata(filters)
            metadata["file_type"] = format
            metadata["record_count"] = len(data)
            storage_path = self.storage.upload_file(
                file_data=file_data,
                file_name=file_name,
                metadata=metadata,
                folder="textbook_exports"
            )

        logger.info(f"教材清单导出成功: {file_name}, 格式: {format}, 记录数: {len(data)}")
        return file_data, file_name, storage_path or f"./exports/{file_name}"

    def export_funnel_report(
        self,
        funnel_data: pl.DataFrame,
        metrics: Dict,
        filters: Optional[Dict] = None,
        format: str = "excel",
        save_to_storage: bool = True
    ) -> Tuple[bytes, str, str]:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filter_suffix = serialize_filters(filters)
        if filter_suffix:
            filter_suffix = f"_{filter_suffix}"

        if format == "excel":
            metrics_df = pl.DataFrame([metrics])
            sheets = {
                "漏斗分析": funnel_data,
                "关键指标": metrics_df,
            }
            file_data = self.excel.export_multiple_sheets(
                sheets_data=sheets,
                filters=filters,
                title="教材订购漏斗分析报告"
            )
            file_name = f"漏斗分析报告_{timestamp}{filter_suffix}.xlsx"
            mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif format == "pdf":
            file_data = self.pdf.export_to_pdf(
                data=funnel_data,
                filters=filters,
                title="教材订购漏斗分析报告"
            )
            file_name = f"漏斗分析报告_{timestamp}{filter_suffix}.pdf"
            mime_type = "application/pdf"
        else:
            raise ValueError(f"不支持的导出格式: {format}")

        storage_path = None
        if save_to_storage:
            metadata = generate_filter_metadata(filters)
            metadata["file_type"] = format
            metadata["report_type"] = "funnel"
            storage_path = self.storage.upload_file(
                file_data=file_data,
                file_name=file_name,
                metadata=metadata,
                folder="funnel_reports"
            )

        logger.info(f"漏斗分析报告导出成功: {file_name}, 格式: {format}")
        return file_data, file_name, storage_path or f"./exports/{file_name}"

    def export_approval_records(
        self,
        data: pl.DataFrame,
        filters: Optional[Dict] = None,
        format: str = "excel",
        save_to_storage: bool = True
    ) -> Tuple[bytes, str, str]:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filter_suffix = serialize_filters(filters)
        if filter_suffix:
            filter_suffix = f"_{filter_suffix}"

        if format == "excel":
            file_data = self.excel.export_to_excel(
                data=data,
                filters=filters,
                sheet_name="审批记录",
                title="教材审批记录"
            )
            file_name = f"审批记录_{timestamp}{filter_suffix}.xlsx"
        elif format == "pdf":
            file_data = self.pdf.export_to_pdf(
                data=data,
                filters=filters,
                title="教材审批记录"
            )
            file_name = f"审批记录_{timestamp}{filter_suffix}.pdf"
        else:
            raise ValueError(f"不支持的导出格式: {format}")

        storage_path = None
        if save_to_storage:
            metadata = generate_filter_metadata(filters)
            metadata["file_type"] = format
            metadata["record_count"] = len(data)
            storage_path = self.storage.upload_file(
                file_data=file_data,
                file_name=file_name,
                metadata=metadata,
                folder="approval_exports"
            )

        logger.info(f"审批记录导出成功: {file_name}, 格式: {format}, 记录数: {len(data)}")
        return file_data, file_name, storage_path or f"./exports/{file_name}"

    def export_gap_report(
        self,
        gap_data: pl.DataFrame,
        summary: Dict,
        filters: Optional[Dict] = None,
        format: str = "excel",
        save_to_storage: bool = True
    ) -> Tuple[bytes, str, str]:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if format == "excel":
            summary_df = pl.DataFrame([
                {"指标": "总缺口数", "数值": summary.get("total_gaps", 0)},
                {"指标": "高优先级", "数值": summary.get("by_severity", {}).get("high", 0)},
                {"指标": "中优先级", "数值": summary.get("by_severity", {}).get("medium", 0)},
                {"指标": "低优先级", "数值": summary.get("by_severity", {}).get("low", 0)},
                {"指标": "待处理", "数值": summary.get("by_status", {}).get("open", 0)},
                {"指标": "处理中", "数值": summary.get("by_status", {}).get("in_progress", 0)},
                {"指标": "已关闭", "数值": summary.get("by_status", {}).get("closed", 0)},
            ])
            sheets = {
                "缺口汇总": summary_df,
                "缺口明细": gap_data,
            }
            file_data = self.excel.export_multiple_sheets(
                sheets_data=sheets,
                filters=filters,
                title="数据缺口分析报告"
            )
            file_name = f"缺口分析报告_{timestamp}.xlsx"
        elif format == "pdf":
            file_data = self.pdf.export_to_pdf(
                data=gap_data,
                filters=filters,
                title="数据缺口分析报告"
            )
            file_name = f"缺口分析报告_{timestamp}.pdf"
        else:
            raise ValueError(f"不支持的导出格式: {format}")

        storage_path = None
        if save_to_storage:
            metadata = generate_filter_metadata(filters)
            metadata["file_type"] = format
            metadata["report_type"] = "gap"
            storage_path = self.storage.upload_file(
                file_data=file_data,
                file_name=file_name,
                metadata=metadata,
                folder="gap_reports"
            )

        logger.info(f"缺口分析报告导出成功: {file_name}, 格式: {format}")
        return file_data, file_name, storage_path or f"./exports/{file_name}"

    def get_export_history(self, prefix: str = ""):
        return self.storage.list_files(prefix)


export_service = ExportService()
