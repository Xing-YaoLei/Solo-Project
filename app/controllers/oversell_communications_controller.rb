class OversellCommunicationsController < ApplicationController
  before_action :set_order

  def create
    @oversell_communication = @order.oversell_communications.build(oversell_communication_params)
    @oversell_communication.user = current_user
    authorize @oversell_communication

    if @oversell_communication.save
      redirect_to @order, notice: "沟通记录已添加。"
    else
      redirect_to @order, alert: "添加沟通记录失败。"
    end
  end

  private

  def set_order
    @order = Order.find(params[:order_id])
  end

  def oversell_communication_params
    params.require(:oversell_communication).permit(:direction, :content, :communication_type)
  end
end
