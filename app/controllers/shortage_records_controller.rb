class ShortageRecordsController < ApplicationController
  before_action :require_user
  before_action :set_shortage_record, only: [:update, :destroy, :handle]

  def create
    pickup_order_id = params[:pickup_order_id] || params.dig(:shortage_record, :pickup_order_id)
    @pickup_order = PickupOrder.find(pickup_order_id)
    @shortage_record = @pickup_order.shortage_records.new(shortage_record_params)
    if @shortage_record.save
      @pickup_order.log_activity('update_item', user: current_user, details: "记录短少: #{@shortage_record.pickup_item&.product_name} - #{@shortage_record.shortage_quantity}件")
      redirect_to @pickup_order, notice: '短少记录创建成功'
    else
      redirect_to @pickup_order, alert: @shortage_record.errors.full_messages.join(', ')
    end
  end

  def update
    if @shortage_record.update(shortage_record_params)
      redirect_to @shortage_record.pickup_order, notice: '短少记录更新成功'
    else
      redirect_to @shortage_record.pickup_order, alert: @shortage_record.errors.full_messages.join(', ')
    end
  end

  def destroy
    @pickup_order = @shortage_record.pickup_order
    @shortage_record.destroy
    redirect_to @pickup_order, notice: '短少记录已删除'
  end

  def handle
    if @shortage_record.pending?
      handling_method = params[:handling_method]
      compensation_amount = params[:compensation_amount]
      remark = params[:remark]
      
      if params[:shortage_record].present?
        handling_method ||= params[:shortage_record][:handling_method]
        compensation_amount ||= params[:shortage_record][:compensation_amount]
        remark ||= params[:shortage_record][:remark]
      end
      
      handling_method ||= '退款'
      
      if compensation_amount.blank? && @shortage_record.pickup_item
        compensation_amount = @shortage_record.pickup_item.unit_price.to_f * @shortage_record.shortage_quantity
      end
      
      @shortage_record.mark_handled!(
        user: current_user,
        handling_method: handling_method,
        compensation_amount: compensation_amount,
        remark: remark
      )
      @shortage_record.pickup_order.log_activity('handle_shortage', user: current_user, details: "处理短少: #{@shortage_record.handling_method}")
      redirect_to @shortage_record.pickup_order, notice: '短少已处理'
    else
      redirect_to @shortage_record.pickup_order, alert: '该短少记录已处理'
    end
  end

  private

  def set_shortage_record
    @shortage_record = ShortageRecord.find(params[:id])
  end

  def shortage_record_params
    params.require(:shortage_record).permit(:pickup_item_id, :shortage_quantity, :reason, :handling_method, :compensation_amount, :remark)
  end
end
