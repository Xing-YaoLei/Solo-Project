class OrdersController < ApplicationController
  before_action :set_order, only: [:show, :edit, :update, :destroy, :confirm, :cancel, :check_in, :complete]

  def index
    authorize Order
    scope = policy_scope(Order).order(created_at: :desc)

    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.oversold if params[:oversold].present? && params[:oversold] == "true"
    scope = scope.where(package_id: params[:package_id]) if params[:package_id].present?
    scope = scope.where(channel_id: params[:channel_id]) if params[:channel_id].present?

    @orders = scope.page(params[:page]).per(20)
  end

  def oversold
    authorize Order, :oversold_index?
    @orders = Order.oversold.order(created_at: :desc).page(params[:page]).per(20)
    render :index
  end

  def show
    authorize @order
    @oversell_communications = @order.oversell_communications.chronological
    @oversell_reviews = @order.oversell_reviews.latest_first
    @check_in_records = @order.check_in_records.order(created_at: :desc)
    @redemption_records = @order.redemption_records.order(created_at: :desc)
  end

  def new
    @order = Order.new
    @order.check_in_date = Date.tomorrow
    @order.check_out_date = 2.days.from_now.to_date
    authorize @order
  end

  def create
    @order = Order.new(order_params)
    @order.staff = current_user if current_user.staff?
    authorize @order

    price_calculator = PriceCalculator.new(@order.package, @order.channel, @order.quantity, @order.check_in_date)
    @order.unit_price = price_calculator.calculate_unit_price
    @order.channel_price = price_calculator.channel_price

    if @order.save
      redirect_to @order, notice: "订单创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @order
  end

  def update
    authorize @order

    if @order.update(order_params)
      redirect_to @order, notice: "订单更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @order
    @order.destroy
    redirect_to orders_url, notice: "订单已删除。"
  end

  def confirm
    authorize @order

    if @order.confirm!
      redirect_to @order, notice: "订单已确认。"
    else
      redirect_to @order, alert: "订单确认失败。"
    end
  end

  def cancel
    authorize @order

    if @order.cancel!
      redirect_to @order, notice: "订单已取消。"
    else
      redirect_to @order, alert: "订单取消失败。"
    end
  end

  def check_in
    authorize @order

    if @order.check_in!
      CheckInRecord.create!(order: @order, staff: current_user, actual_check_in_at: Time.current)
      redirect_to @order, notice: "已办理入住。"
    else
      redirect_to @order, alert: "入住办理失败。"
    end
  end

  def complete
    authorize @order

    if @order.complete!
      check_in_record = @order.check_in_records.last
      check_in_record&.update(actual_check_out_at: Time.current)
      redirect_to @order, notice: "订单已完成。"
    else
      redirect_to @order, alert: "订单完成失败。"
    end
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def order_params
    params.require(:order).permit(:package_id, :channel_id, :customer_name, :customer_phone,
                                   :customer_email, :quantity, :check_in_date, :check_out_date,
                                   :notes, :external_order_id)
  end
end
