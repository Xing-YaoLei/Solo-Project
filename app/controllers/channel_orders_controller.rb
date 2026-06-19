class ChannelOrdersController < ApplicationController
  before_action :set_channel_order, only: [:show, :edit, :update, :destroy]

  def index
    @channel_orders = ChannelOrder.all
  end

  def show
  end

  def new
    @channel_order = ChannelOrder.new
    @channel_order.build_guest
  end

  def create
    @guest = find_or_create_guest
    @channel_order = ChannelOrder.new(channel_order_params.except(:guest_attributes))
    @channel_order.guest = @guest

    if @channel_order.save
      redirect_to @channel_order, notice: "Channel order was successfully created."
    else
      @channel_order.build_guest unless @channel_order.guest.present?
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    @guest = find_or_create_guest
    order_params = channel_order_params.except(:guest_attributes)

    if @channel_order.update(order_params)
      @channel_order.update(guest: @guest) if @guest.present?
      redirect_to @channel_order, notice: "Channel order was successfully updated.", status: :see_other
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @channel_order.destroy
    redirect_to channel_orders_url, notice: "Channel order was successfully destroyed.", status: :see_other
  end

  private

  def set_channel_order
    @channel_order = ChannelOrder.find(params[:id])
  end

  def find_or_create_guest
    guest_params = channel_order_params[:guest_attributes]
    return nil unless guest_params.present?

    guest = Guest.find_by(id_number: guest_params[:id_number]) if guest_params[:id_number].present?
    guest ||= Guest.find_by(phone: guest_params[:phone]) if guest_params[:phone].present?
    guest ||= Guest.create(guest_params.permit(:name, :phone, :id_number))

    guest
  end

  def channel_order_params
    params.require(:channel_order).permit(
      :order_no,
      :property_id,
      :guest_id,
      :check_in,
      :check_out,
      :channel,
      :status,
      :price,
      :guest_count,
      guest_attributes: [:name, :phone, :id_number]
    )
  end
end
