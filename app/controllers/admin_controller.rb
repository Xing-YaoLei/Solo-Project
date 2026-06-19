class AdminController < ApplicationController
  before_action :authenticate_user!

  def dashboard
    @today_work_orders = WorkOrder.where(created_at: Date.today.all_day).count
    @in_progress_work_orders = WorkOrder.where(status: 'in_progress').count
    @pending_work_orders = WorkOrder.where(status: 'pending').count
    @repair_rate = WorkOrder.repair_rate(30.days.ago..Time.current)
    @low_stock_parts = Part.low_stock.count
    @out_of_stock_parts = Part.out_of_stock.count
    @recent_work_orders = WorkOrder.order(created_at: :desc).limit(10)
  end

  def repair_rate_analysis
    @start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
    @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.current

    period = @start_date.beginning_of_day..@end_date.end_of_day
    @repair_rate = WorkOrder.repair_rate(period)
    @total_work_orders = WorkOrder.where(created_at: period).count
    @repair_count = WorkOrder.repairs.where(created_at: period).count

    @daily_data = {}
    (@start_date..@end_date).each do |date|
      @daily_data[date] = WorkOrder.repair_rate(date.all_day)
    end
  end

  def export_work_orders
    @work_orders = WorkOrder.all.order(created_at: :desc)

    respond_to do |format|
      format.xlsx do
        response.headers['Content-Disposition'] = "attachment; filename=\"work_orders_#{Date.today}.xlsx\""
      end
    end
  end
end
