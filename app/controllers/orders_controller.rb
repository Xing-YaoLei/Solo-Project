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
    @performance = Performance.find(params[:performance_id]) if params[:performance_id]
    @order = Order.new(order_params)
    ticket_types_params = params[:ticket_types] || {}

    selected_tickets = []
    ticket_types_params.each do |tt_id, tt_data|
      next if tt_data[:selected] != "1"
      quantity = tt_data[:quantity].to_i
      next if quantity <= 0
      ticket_type = TicketType.find_by(id: tt_id)
      next unless ticket_type
      quantity.times { selected_tickets << ticket_type }
    end

    ActiveRecord::Base.transaction do
      if @order.save
        performance = @performance || selected_tickets.first&.performance
        raise ActiveRecord::Rollback, "请选择演出或票种" unless performance

        selected_tickets.each do |ticket_type|
          seat = performance.seats.available.order(:section, :row, :seat_number).lock.first
          raise ActiveRecord::Rollback, "#{ticket_type.name}没有可用座位" unless seat

          @order.tickets.create!(
            ticket_type: ticket_type,
            seat: seat
          )
          seat.update!(status: :occupied)
        end

        redirect_to @order, notice: "订单创建成功"
      else
        @ticket_types = @performance&.ticket_types&.active || []
        render :new, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end
    end
  rescue ActiveRecord::Rollback => e
    @ticket_types = @performance&.ticket_types&.active || []
    flash.now[:alert] = e.message if e.message.present?
    render :new, status: :unprocessable_entity
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
