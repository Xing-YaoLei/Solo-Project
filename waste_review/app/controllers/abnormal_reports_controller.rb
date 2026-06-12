class AbnormalReportsController < ApplicationController
  include WasteReportCsvExport

  def index
    @abnormal_reports = AbnormalReport.includes(waste_report: :store)
                                      .by_severity(params[:severity])
                                      .by_resolved(params[:resolved] == "true" ? true : params[:resolved] == "false" ? false : nil)
                                      .order(created_at: :desc)
                                      .limit(50)

    @stats = {
      total_count: @abnormal_reports.count,
      unresolved_count: @abnormal_reports.unresolved.count,
      resolution_rate: AbnormalReport.resolution_rate,
      avg_resolution_time: AbnormalReport.avg_resolution_time
    }

    respond_to do |format|
      format.html
      format.csv do
        export
      end
    end
  end

  def show
    @abnormal_report = AbnormalReport.includes(waste_report: [:store, :waste_items, :review_opinions])
                                     .find(params[:id])
  end

  def update
    @abnormal_report = AbnormalReport.find(params[:id])
    if @abnormal_report.update(abnormal_report_params)
      if @abnormal_report.handling_result.present? && !@abnormal_report.resolved?
        @abnormal_report.resolve!(@abnormal_report.handling_result, current_operator)
      end
      respond_to do |format|
        format.html { redirect_to @abnormal_report, notice: "异常单已更新" }
        format.turbo_stream
      end
    else
      render :show, status: :unprocessable_entity
    end
  end

  def resolve
    @abnormal_report = AbnormalReport.find(params[:id])
    handling_result = params[:handling_result] || "已标记解决"
    @abnormal_report.resolve!(handling_result, current_operator)
    respond_to do |format|
      format.html { redirect_to @abnormal_report, notice: "异常单已标记为已解决" }
      format.turbo_stream
    end
  end

  def export
    abnormal_reports = AbnormalReport.includes(waste_report: :store)
                                      .by_severity(params[:severity])
                                      .by_resolved(params[:resolved] == "true" ? true : params[:resolved] == "false" ? false : nil)
                                      .order(created_at: :desc)

    csv_data = generate_abnormal_csv(abnormal_reports)
    filename = "异常单导出_#{Date.today}.csv"

    respond_to do |format|
      format.csv do
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        response.headers["Content-Disposition"] = "attachment; filename=\"#{URI.encode_www_form_component(filename)}\""
        self.response_body = csv_data
      end
    end
  end

  private

  def abnormal_report_params
    params.require(:abnormal_report).permit(:handling_result, :responsibility_attribution, :impact_scope)
  end

  def current_operator
    defined?(Current) && Current.respond_to?(:user) && Current.user&.respond_to?(:name) ? Current.user.name : "system"
  end
end
