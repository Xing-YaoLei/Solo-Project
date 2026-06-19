class WorkOrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order, only: %i[show edit update destroy]

  def index
    @q = WorkOrder.ransack(params[:q])
    @work_orders = @q.result.includes(:assigned_to, :created_by).order(created_at: :desc)
    @pagy, @work_orders = pagy(@work_orders)

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end

  def bulk_update_status
    work_order_ids = params[:work_order_ids] || []
    new_status = params[:bulk_status]

    if work_order_ids.present? && WorkOrder::STATUSES.include?(new_status)
      WorkOrder.where(id: work_order_ids).find_each do |work_order|
        old_status = work_order.status
        if work_order.update(status: new_status) && old_status != new_status
          work_order.timeline_events.create!(
            event_type: :status_change,
            user: current_user,
            content: "批量更新状态从 #{old_status} 变更为 #{new_status}",
            metadata: { old_status: old_status, new_status: new_status }
          )
        end
      end
      redirect_to work_orders_path, notice: "已批量更新 #{work_order_ids.count} 个工单的状态。"
    else
      redirect_to work_orders_path, alert: '请选择工单和要更新的状态。'
    end
  end

  def show
    @work_order_items = @work_order.work_order_items.includes(:technician)
    @work_order_parts = @work_order.work_order_parts.includes(:part)
    @quotes = @work_order.quotes.includes(:created_by, :approved_by, quote_items: [])
    @inspection_photos = @work_order.inspection_photos
    @attachments = @work_order.attachments
    @notes = @work_order.notes.includes(:author)
    @timeline_events = @work_order.timeline_events.includes(:user).order(created_at: :desc)
    @stock_alerts = @work_order.stock_alerts.includes(:part, :handler, :reassigned_to)
    @child_work_orders = @work_order.child_work_orders
  end

  def new
    @work_order = WorkOrder.new
  end

  def create
    @work_order = WorkOrder.new(work_order_params)
    @work_order.created_by = current_user
    @work_order.user = current_user

    respond_to do |format|
      if @work_order.save
        @work_order.timeline_events.create!(
          event_type: :work_order_created,
          user: current_user,
          content: "工单 #{@work_order.work_order_no} 已创建"
        )
        format.html { redirect_to @work_order, notice: '工单已成功创建。' }
        format.turbo_stream { redirect_to @work_order, notice: '工单已成功创建。' }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit; end

  def update
    respond_to do |format|
      old_status = @work_order.status
      if @work_order.update(work_order_params)
        if old_status != @work_order.status
          @work_order.timeline_events.create!(
            event_type: :status_change,
            user: current_user,
            content: "状态从 #{old_status} 变更为 #{@work_order.status}",
            metadata: { old_status: old_status, new_status: @work_order.status }
          )
        end
        format.html { redirect_to @work_order, notice: '工单已成功更新。' }
        format.turbo_stream { redirect_to @work_order, notice: '工单已成功更新。' }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @work_order.destroy
    respond_to do |format|
      format.html { redirect_to work_orders_url, notice: '工单已成功删除。' }
      format.turbo_stream { redirect_to work_orders_url, notice: '工单已成功删除。' }
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:id])
  end

  def work_order_params
    params.require(:work_order).permit(
      :work_order_no,
      :customer_name,
      :customer_phone,
      :vehicle_plate,
      :vehicle_brand,
      :vehicle_model,
      :vehicle_mileage,
      :description,
      :status,
      :priority,
      :is_repair,
      :total_amount,
      :completed_at,
      :assigned_to_id,
      :parent_work_order_id
    )
  end
end
