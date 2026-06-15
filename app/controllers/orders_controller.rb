class OrdersController < ApplicationController
  before_action :set_order, only: [:show, :edit, :update, :pay, :refund]

  def index
    scope = Order.includes(:user, :course, :channel)

    if params[:status].present?
      scope = scope.where(status: params[:status])
    end

    if params[:channel_id].present?
      scope = scope.where(channel_id: params[:channel_id])
    end

    @orders = scope.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
  end

  def new
    @order = Order.new
  end

  def create
    @order = Order.new(order_params)
    if @order.save
      redirect_to @order, notice: "订单已创建"
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @order.update(order_params)
      redirect_to @order, notice: "订单已更新"
    else
      render :edit
    end
  end

  def pay
    @order.pay!
    @order.update(paid_at: Time.current)

    create_enrollment_for_order

    redirect_to @order, notice: "订单已支付"
  end

  def refund
    refund_amount = params[:refund_amount] || @order.amount
    @order.refund!
    @order.update(refund_amount: refund_amount, refunded_at: Time.current)

    @order.enrollments.each(&:refund!)

    redirect_to @order, notice: "订单已退款"
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def order_params
    params.require(:order).permit(:user_id, :course_id, :channel_id, :amount, :original_amount, :discount_amount, :pay_method, :status)
  end

  def create_enrollment_for_order
    return unless @order.paid?

    Enrollment.create!(
      user: @order.user,
      course: @order.course,
      channel: @order.channel,
      order: @order,
      enrolled_at: Time.current,
      expired_at: 90.days.from_now,
      status: :enrolled,
      progress: 0,
      completed_lessons_count: 0,
      total_lessons_count: @order.course.lessons.count
    )
  end
end
