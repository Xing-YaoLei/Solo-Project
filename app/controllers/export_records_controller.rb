class ExportRecordsController < ApplicationController
  before_action :set_export_record, only: [:show, :destroy]

  def index
    authorize ExportRecord

    add_breadcrumb "报告与导出", reports_path
    add_breadcrumb "导出记录", export_records_path
    @page_title = "导出记录"

    @q = policy_scope(ExportRecord).ransack(params[:q])
    @export_records = @q.result.includes(:user).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @export_record

    add_breadcrumb "报告与导出", reports_path
    add_breadcrumb "导出记录", export_records_path
    add_breadcrumb "详情", export_record_path(@export_record)
  end

  def destroy
    authorize @export_record
    @export_record.destroy

    redirect_to export_records_path, notice: "导出记录已删除"
  end

  private

  def set_export_record
    @export_record = policy_scope(ExportRecord).find(params[:id])
  end
end
