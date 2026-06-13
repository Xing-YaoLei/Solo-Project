class PickupItemsController < ApplicationController
  before_action :require_user
  before_action :set_pickup_item, only: [:update, :destroy]

  def create
    pickup_order_id = params[:pickup_order_id] || params.dig(:pickup_item, :pickup_order_id)
    @pickup_order = PickupOrder.find(pickup_order_id)
    @pickup_item = @pickup_order.pickup_items.new(pickup_item_params)
    if @pickup_item.save
      @pickup_order.log_activity('add_item', user: current_user, details: "添加商品: #{@pickup_item.product_name}")
      redirect_to @pickup_order, notice: '商品添加成功'
    else
      redirect_to @pickup_order, alert: @pickup_item.errors.full_messages.join(', ')
    end
  end

  def update
    if @pickup_item.update(pickup_item_params)
      @pickup_item.pickup_order.log_activity('update_item', user: current_user, details: "更新商品: #{@pickup_item.product_name}")
      redirect_to @pickup_item.pickup_order, notice: '商品更新成功'
    else
      redirect_to @pickup_item.pickup_order, alert: @pickup_item.errors.full_messages.join(', ')
    end
  end

  def destroy
    @pickup_order = @pickup_item.pickup_order
    @pickup_item.destroy
    redirect_to @pickup_order, notice: '商品已删除'
  end

  private

  def set_pickup_item
    @pickup_item = PickupItem.find(params[:id])
  end

  def pickup_item_params
    params.require(:pickup_item).permit(:product_name, :product_code, :product_tag, :expected_quantity, :actual_quantity, :unit_price, :remark)
  end
end
