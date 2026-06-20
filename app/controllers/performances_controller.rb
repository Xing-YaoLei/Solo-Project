class PerformancesController < ApplicationController
  before_action :set_performance, only: %i[show edit update destroy seat_map generate_checkin_codes]

  def index
    @performances = Performance.order(start_time: :desc)
    @performances = @performances.where(status: params[:status]) if params[:status].present?
    @performances = paginate(@performances, per_page: 20)
  end

  def show
    @ticket_types = @performance.ticket_types.order(:created_at)
    @seats = @performance.seats.order(:section, :row, :seat_number)
    @sponsorships = @performance.sponsorships.includes(:sponsor)
    @status_logs = StatusLog.for_trackable(@performance).recent.limit(20)
    @checkin_codes = CheckinCode.joins(ticket: :ticket_type).where(ticket_types: { performance_id: @performance.id }).includes(ticket: [:order]).order(created_at: :desc).limit(20)
    @checkin_codes_count = CheckinCode.joins(ticket: :ticket_type).where(ticket_types: { performance_id: @performance.id }).count
  end

  def new
    @performance = Performance.new
  end

  def create
    @performance = Performance.new(performance_params)
    if @performance.save
      redirect_to @performance, notice: "演出排期创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @performance.update(performance_params)
      redirect_to @performance, notice: "演出排期更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @performance.destroy
    redirect_to performances_url, notice: "演出排期已删除"
  end

  def seat_map
    @seats = @performance.seats.order(:section, :row, :seat_number)
  end

  def generate_checkin_codes
    GenerateCheckinCodesJob.perform_now(@performance.id)
    redirect_to @performance, notice: "签到码已生成"
  end

  private

  def set_performance
    @performance = Performance.find(params[:id])
  end

  def performance_params
    params.require(:performance).permit(:name, :description, :start_time, :end_time, :venue, :total_seats, :status)
  end
end
