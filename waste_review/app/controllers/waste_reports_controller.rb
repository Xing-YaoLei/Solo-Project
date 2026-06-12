class WasteReportsController < ApplicationController
  include WasteReportCsvExport

  before_action :set_waste_report, only: %i[show edit update destroy review settle approve reject download]
  before_action :set_stores, only: %i[new create edit update]

  def index
    @waste_reports = WasteReport.includes(:store, :waste_items, :abnormal_report)
                                .by_status(params[:status])
                                .by_store(params[:store_id])
                                .by_date_range(params[:start_date], params[:end_date])
                                .order(report_date: :desc, created_at: :desc)
                                .limit(50)

    @stats = {
      total_count: @waste_reports.count,
      total_cost: @waste_reports.sum(:total_cost),
      avg_waste_rate: @waste_reports.count.positive? ? (@waste_reports.sum(:waste_rate) / @waste_reports.count).round(2) : 0,
      abnormal_count: @waste_reports.joins(:abnormal_report).count
    }

    respond_to do |format|
      format.html
      format.csv do
        export_batch
      end
    end
  end

  def show
    @waste_report = WasteReport.includes(:store, :waste_items, :review_opinions, :cost_entries, :status_logs, :abnormal_report)
                               .find(params[:id])
  end

  def new
    default_reporter = defined?(Current) && Current.respond_to?(:user) && Current.user&.respond_to?(:name) ? Current.user.name : nil
    @waste_report = WasteReport.new(store: Store.first, report_date: Date.today, reporter: default_reporter)
    3.times { @waste_report.waste_items.build }
  end

  def create
    @waste_report = WasteReport.new(waste_report_params)
    if @waste_report.save
      @waste_report.recalculate_totals!
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单创建成功" }
        format.turbo_stream
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @waste_report.update(waste_report_params)
      @waste_report.recalculate_totals!
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单更新成功" }
        format.turbo_stream
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    return redirect_to waste_reports_path, alert: "仅已提交状态的报损单可删除" unless @waste_report.submitted?

    @waste_report.destroy
    redirect_to waste_reports_path, notice: "报损单已删除"
  end

  def review
    if @waste_report.transition_to!(:reviewing, current_operator, "提交复核")
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单已提交复核" }
        format.turbo_stream
      end
    else
      redirect_to @waste_report, alert: "状态变更失败"
    end
  end

  def settle
    if @waste_report.transition_to!(:settled, current_operator, "完成结算")
      @waste_report.recalculate_totals!
      SidekiqSafe.perform_async(WasteReportSettlementJob, @waste_report.id)
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单已结算" }
        format.turbo_stream
      end
    else
      redirect_to @waste_report, alert: "状态变更失败"
    end
  end

  def approve
    opinion_params = params[:review_opinion] || {}
    @waste_report.review_opinions.create!(
      result: :approved,
      reviewer: current_operator,
      opinion: opinion_params[:opinion]
    )
    if @waste_report.transition_to!(:approved, current_operator, "审批通过")
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单已审批通过" }
        format.turbo_stream
      end
    else
      redirect_to @waste_report, alert: "状态变更失败"
    end
  end

  def reject
    opinion_params = params[:review_opinion] || {}
    @waste_report.review_opinions.create!(
      result: :rejected,
      reviewer: current_operator,
      opinion: opinion_params[:opinion]
    )
    if @waste_report.transition_to!(:rejected, current_operator, "审批驳回")
      respond_to do |format|
        format.html { redirect_to @waste_report, notice: "报损单已驳回" }
        format.turbo_stream
      end
    else
      redirect_to @waste_report, alert: "状态变更失败"
    end
  end

  def download
    waste_reports = WasteReport.includes(:store, :waste_items, :cost_entries, :review_opinions, :abnormal_report)
                               .where(id: params[:id])
    csv_data = generate_csv(waste_reports, start_date: params[:start_date], end_date: params[:end_date])
    filename = "报损单_#{@waste_report.id}_#{Date.today}.csv"

    send_csv_data(csv_data, filename)
  end

  def export_batch
    waste_reports = WasteReport.includes(:store, :waste_items, :cost_entries, :review_opinions, :abnormal_report)
                                .by_status(params[:status])
                                .by_store(params[:store_id])
                                .by_date_range(params[:start_date], params[:end_date])
                                .order(report_date: :desc)

    if params[:async] == "true"
      SidekiqSafe.perform_async(ExportWasteReportsJob, params[:status], params[:store_id], params[:start_date], params[:end_date])
      redirect_to waste_reports_path, notice: "导出任务已提交，稍后请查看导出记录"
    else
      csv_data = generate_csv(waste_reports, start_date: params[:start_date], end_date: params[:end_date])
      filename = "报损单批量导出_#{Date.today}.csv"
      send_csv_data(csv_data, filename)
    end
  end

  def statistics
    @start_date = params[:start_date]&.to_date || 1.month.ago.to_date
    @end_date = params[:end_date]&.to_date || Date.today

    @overall_stats = {
      overall_rate: WasteReport.overall_waste_rate(@start_date, @end_date),
      total_cost: WasteReport.by_date_range(@start_date, @end_date).sum(:total_cost),
      report_count: WasteReport.by_date_range(@start_date, @end_date).count,
      abnormal_count: AbnormalReport.where(created_at: @start_date.beginning_of_day..@end_date.end_of_day).count
    }

    @store_ranking = WasteReport.waste_rate_by_store(@start_date, @end_date)
    @trend_data = build_trend_data(@start_date, @end_date)
    @reason_analysis = build_reason_analysis(@start_date, @end_date)
  end

  private

  def set_waste_report
    @waste_report = WasteReport.find(params[:id])
  end

  def waste_report_params
    params.require(:waste_report).permit(
      :store_id, :report_date, :reporter, :notes, :status,
      waste_items_attributes: [:id, :product_name, :product_sku, :quantity, :unit, :unit_cost, :waste_reason, :category, :_destroy],
      cost_entries_attributes: [:id, :amount, :cost_type, :responsible_store_id, :note, :_destroy]
    )
  end

  def set_stores
    @stores = Store.active.order(:name)
  end

  def current_operator
    defined?(Current) && Current.respond_to?(:user) && Current.user&.respond_to?(:name) ? Current.user.name : "system"
  end

  def send_csv_data(csv_data, filename)
    respond_to do |format|
      format.csv do
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        response.headers["Content-Disposition"] = "attachment; filename=\"#{URI.encode_www_form_component(filename)}\""
        self.response_body = csv_data
      end
    end
  end

  def build_trend_data(start_date, end_date)
    months = []
    current = start_date.beginning_of_month
    while current <= end_date.end_of_month
      reports = WasteReport.where(report_date: current.all_month)
      total_cost = reports.sum(:total_cost)
      avg_rate = reports.count.positive? ? (reports.sum(:waste_rate) / reports.count).round(2) : 0

      months << {
        month: current.strftime("%Y-%m"),
        report_count: reports.count,
        total_cost: total_cost,
        avg_rate: avg_rate
      }
      current = current.next_month
    end
    months
  end

  def build_reason_analysis(start_date, end_date)
    items = WasteItem.joins(:waste_report)
                     .where(waste_reports: { report_date: start_date..end_date })

    reason_groups = items.group(:waste_reason).sum(:subtotal)
    total = reason_groups.values.sum
    reason_groups.map do |reason, amount|
      {
        reason: reason,
        amount: amount,
        percentage: total.positive? ? ((amount / total) * 100).round(2) : 0
      }
    end.sort_by { |r| -r[:amount] }
  end
end
