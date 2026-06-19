class WorkOrderItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_work_order_item, only: %i[edit update destroy]

  def index
    @work_order_items = @work_order.work_order_items.includes(:technician)
  end

  def new
    @work_order_item = @work_order.work_order_items.build
  end

  def create
    @work_order_item = @work_order.work_order_items.build(work_order_item_params)

    respond_to do |format|
      if @work_order_item.save
        @work_order.timeline_events.create!(
          event_type: :note_added,
          user: current_user,
          content: "添加工单项目: #{@work_order_item.name}",
          metadata: { work_order_item_id: @work_order_item.id }
        )
        format.html { redirect_to @work_order, notice: '工单项目已成功添加。' }
        format.turbo_stream
      else
        format.html { redirect_to @work_order, alert: @work_order_item.errors.full_messages.join(', ') }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit; end

  def update
    respond_to do |format|
      old_status = @work_order_item.status
      if @work_order_item.update(work_order_item_params)
        if old_status != @work_order_item.status
          @work_order.timeline_events.create!(
            event_type: :status_change,
            user: current_user,
            content: "项目 #{@work_order_item.name} 状态从 #{old_status} 变更为 #{@work_order_item.status}",
            metadata: { work_order_item_id: @work_order_item.id, old_status: old_status, new_status: @work_order_item.status }
          )
        end
        format.html { redirect_to @work_order, notice: '工单项目已成功更新。' }
        format.turbo_stream
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @work_order_item.destroy
    respond_to do |format|
      format.html { redirect_to @work_order, notice: '工单项目已成功删除。' }
      format.turbo_stream
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_work_order_item
    @work_order_item = @work_order.work_order_items.find(params[:id])
  end

  def work_order_item_params
    params.require(:work_order_item).permit(
      :name,
      :description,
      :quantity,
      :unit_price,
      :labor_fee,
      :status,
      :technician_id
    )
  end
end
