class ReportsController < ApplicationController
  skip_after_action :verify_authorized, only: [:index, :preview]

  def index
    authorize ExportRecord, :create?

    add_breadcrumb "报告与导出", reports_path
    @page_title = "报告导出 | 合规审计结算台"

    load_export_filters

    @recent_exports = policy_scope(ExportRecord)
      .includes(:user)
      .recent
      .limit(10)

    load_preview_data if params[:export_type].present?
  end

  def export
    authorize ExportRecord, :create?

    service = ReportExportService.call(current_user, export_params)

    respond_to do |format|
      if service.success?
        format.html do
          redirect_to reports_path, notice: "导出任务已创建，完成后将通知您下载"
        end
        format.turbo_stream do
          streams = [
            turbo_stream.replace("recent_exports_list", partial: "reports/recent_exports",
                                 locals: { recent_exports: policy_scope(ExportRecord).includes(:user).recent.limit(10) })
          ]
          streams += render_turbo_flash(notice: "导出任务已创建，完成后将通知您下载")
          render turbo_stream: streams
        end
      else
        message = service.errors.map { |e| e[:message] }.join("，")
        format.html { redirect_to reports_path, alert: message }
        format.turbo_stream { render turbo_stream: render_turbo_flash(alert: message) }
      end
    end
  end

  def download
    export_record = ExportRecord.find(params[:id])
    authorize export_record, :download?

    if export_record.downloadable?
      redirect_to export_record.file_url, allow_other_host: true
    elsif export_record.failed?
      redirect_to reports_path, alert: "导出任务失败，请重新尝试"
    elsif export_record.pending? || export_record.processing?
      redirect_to reports_path, alert: "导出文件正在生成中，请稍后再试"
    else
      redirect_to reports_path, alert: "下载链接已过期，请重新导出"
    end
  end

  def preview
    authorize ExportRecord, :create?

    load_export_filters
    load_preview_data

    respond_to do |format|
      format.html
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "preview_content",
          partial: "reports/preview_content",
          locals: preview_locals
        )
      end
    end
  end

  private

  def load_export_filters
    @export_types = ExportRecord::EXPORT_TYPES.map do |type|
      [I18n.t("export_types.#{type}", default: type.humanize), type]
    end

    @supplier_options = Supplier.active.order(:name).pluck(:name, :id)
    @audit_type_options = Audit.audit_type_options
    @status_options = Audit.status.values.map do |s|
      [I18n.t("audit_statuses.#{s}", default: s.humanize), s]
    end
    @severity_options = ExceptionOrder.severity.values.map do |s|
      [I18n.t("severities.#{s}", default: s.humanize), s]
    end

    @export_type = params[:export_type]
    @start_date = params[:start_date]&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today
    @selected_suppliers = params[:supplier_ids] || []
    @selected_audit_types = params[:audit_types] || []
    @selected_severities = params[:severities] || []
    @include_caliber_note = params[:include_caliber_note] != "false"
    @include_audit_details = params[:include_audit_details] == "true"
    @include_exception_details = params[:include_exception_details] == "true"
  end

  def load_preview_data
    period = { start: @start_date, end: @end_date }
    @preview_data = {}
    @caliber_note = nil

    case @export_type
    when "rectification_report", "exception_summary"
      calc = RectificationRateCalculator.call(nil, period, group_by: :trend, include_details: true)
      if calc.success?
        @preview_data = calc.result
        @caliber_note = @preview_data[:caliber_note]
      end
    when "audit_summary", "full_audit_record"
      audits = Audit.includes(:supplier, :creator)
        .where(created_at: period[:start].beginning_of_day..period[:end].end_of_day)
      audits = audits.where(supplier_id: @selected_suppliers) if @selected_suppliers.present?
      audits = audits.where(audit_type: @selected_audit_types) if @selected_audit_types.present?

      @preview_data[:total] = audits.count
      @preview_data[:completed] = audits.completed.count
      @preview_data[:in_progress] = audits.where.not(status: %w[approved archived rejected]).count
      @preview_data[:rejected] = audits.where(status: :rejected).count
      @preview_data[:sample] = audits.order(created_at: :desc).limit(10).to_a
      @caliber_note = ExportRecord::CALIBER_NOTES[:audit_completeness]
    when "supplier_audit"
      suppliers = Supplier.includes(audits: [:exception_orders])
      suppliers = suppliers.where(id: @selected_suppliers) if @selected_suppliers.present?
      @preview_data[:suppliers] = suppliers.limit(20).to_a
      @preview_data[:total] = suppliers.count
    end
  end

  def preview_locals
    {
      export_type: @export_type,
      preview_data: @preview_data,
      caliber_note: @caliber_note,
      start_date: @start_date,
      end_date: @end_date
    }
  end

  def export_params
    params.permit(
      :export_type, :start_date, :end_date,
      :include_caliber_note, :include_audit_details, :include_exception_details,
      supplier_ids: [], audit_types: [], severities: [], statuses: []
    ).to_h
  end
end
