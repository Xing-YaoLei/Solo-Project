class WorkOrderPartsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_work_order_part, only: %i[edit update destroy]

  def index
    @work_order_parts = @work_order.work_order_parts.includes(:part, :shortage_handled_by)
  end

  def new
    @work_order_part = @work_order.work_order_parts.build
  end

  def create
    @work_order_part = @work_order.work_order_parts.build(work_order_part_params)

    respond_to do |format|
      if @work_order_part.save
        handle_stock_alert(@work_order_part) if @work_order_part.is_out_of_stock?
        @work_order.timeline_events.create!(
          event_type: :part_shortage,
          user: current_user,
          content: "添加配件: #{@work_order_part.part&.name || '未知配件'}",
          metadata: { work_order_part_id: @work_order_part.id, part_id: @work_order_part.part_id }
        )
        format.html { redirect_to @work_order, notice: '工单配件已成功添加。' }
        format.turbo_stream
      else
        format.html { redirect_to @work_order, alert: @work_order_part.errors.full_messages.join(', ') }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit; end

  def update
    respond_to do |format|
      was_out_of_stock = @work_order_part.is_out_of_stock?
      if @work_order_part.update(work_order_part_params)
        if @work_order_part.is_out_of_stock? && !was_out_of_stock
          handle_stock_alert(@work_order_part)
        end
        format.html { redirect_to @work_order, notice: '工单配件已成功更新。' }
        format.turbo_stream
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @work_order_part.destroy
    respond_to do |format|
      format.html { redirect_to @work_order, notice: '工单配件已成功删除。' }
      format.turbo_stream
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_work_order_part
    @work_order_part = @work_order.work_order_parts.find(params[:id])
  end

  def handle_stock_alert(work_order_part)
    return if StockAlert.exists?(work_order_part: work_order_part)

    stock_alert = StockAlert.create!(
      work_order_part: work_order_part,
      work_order: @work_order,
      part: work_order_part.part,
      status: :pending
    )
    @work_order.timeline_events.create!(
      event_type: :part_shortage,
      user: current_user,
      content: "配件缺货告警: #{work_order_part.part&.name} 缺货",
      metadata: { stock_alert_id: stock_alert.id, part_id: work_order_part.part_id }
    )
  end

  def work_order_part_params
    params.require(:work_order_part).permit(
      :part_id,
      :quantity,
      :unit_price,
      :is_out_of_stock,
      :shortage_confirmed,
      :shortage_note,
      :shortage_handled_at,
      :shortage_handled_by_id
    )
  end
end
