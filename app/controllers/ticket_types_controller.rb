class TicketTypesController < ApplicationController
  before_action :set_performance
  before_action :set_ticket_type, only: %i[show edit update destroy]

  def index
    @ticket_types = TicketType.where(performance: nil).or(TicketType.all).order(:created_at)
    @ticket_types = @ticket_types.where(status: params[:status]) if params[:status].present?
    @ticket_types = paginate(@ticket_types, per_page: 20)
  end

  def show
    @tickets = @ticket_type.tickets.order(:created_at)
    @status_logs = StatusLog.for_trackable(@ticket_type).recent.limit(10)
  end

  def new
    @ticket_type = @performance.ticket_types.build
  end

  def create
    @ticket_type = @performance.ticket_types.build(ticket_type_params)
    if @ticket_type.save
      redirect_to @performance, notice: "票种规则创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @ticket_type.update(ticket_type_params)
      redirect_to [@performance, @ticket_type], notice: "票种规则更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @ticket_type.destroy
    redirect_to @performance, notice: "票种规则已删除"
  end

  private

  def set_performance
    @performance = Performance.find(params[:performance_id])
  end

  def set_ticket_type
    @ticket_type = @performance.ticket_types.find(params[:id])
  end

  def ticket_type_params
    params.require(:ticket_type).permit(:name, :price, :description, :sale_start_time, :sale_end_time, :max_quantity, :min_quantity, :refund_policy, :status)
  end
end
