class OrdersController < ApplicationController
  before_action :set_order, only: %i[show edit update destroy confirm cancel refund create_exception]

  def index
    @orders = Order.order(created_at: :desc)
    @orders = @orders.where(status: params[:status]) if params[:status].present?
    @orders = @orders.where(payment_method: params[:payment_method]) if params[:payment_method].present?
    @orders = paginate(@orders, per_page: 20)
  end

  def show
    @tickets = @order.tickets.includes(:ticket_type, :seat)
    @exception_records = @order.exception_records.order(created_at: :desc)
    @status_logs = StatusLog.for_trackable(@order).recent.limit(20)
  end

  def new
    @performance = Performance.find(params[:performance_id]) if params[:performance_id]
    @order = Order.new
    @ticket_types = @performance&.ticket_types&.active || []
  end

  def create
    @order = Order.new(order_params)
    if @order.save
      redirect_to @order, notice: "订单创建成功"
    else
      @performance = Performance.find(params[:performance_id]) if params[:performance_id]
      @ticket_types = @performance&.ticket_types&.active || []
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @order.update(order_params)
      redirect_to @order, notice: "订单更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @order.destroy
    redirect_to orders_url, notice: "订单已删除"
  end

  def confirm
    if @order.may_confirm?
      @order.confirm!
      redirect_to @order, notice: "订单已确认"
    else
      redirect_to @order, alert: "当前状态无法确认"
    end
  end

  def cancel
    if @order.may_cancel?
      @order.cancel!
      redirect_to @order, notice: "订单已取消"
    else
      redirect_to @order, alert: "当前状态无法取消"
    end
  end

  def refund
    if @order.may_refund?
      @order.refund!
      redirect_to @order, notice: "订单已退款"
    else
      redirect_to @order, alert: "当前状态无法退款"
    end
  end

  def create_exception
    @exception_record = @order.create_exception_record!(
      description: params[:description],
      impact_scope: params[:impact_scope],
      responsible_person: params[:responsible_person],
      assignee: params[:assignee]
    )
    redirect_to @exception_record, notice: "异常单已创建"
  end

  def export
    file_path = ExportExcelJob.perform_now("orders", params.to_unsafe_h.slice(:status, :payment_method))
    send_file file_path, filename: File.basename(file_path), type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end

  private

  def set_order
    @order = Order.find(params[:id])
  end

  def order_params
    params.require(:order).permit(:customer_name, :customer_phone, :customer_email, :total_amount, :payment_method, :notes)
  end
end
