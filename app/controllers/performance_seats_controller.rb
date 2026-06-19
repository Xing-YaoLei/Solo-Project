class PerformanceSeatsController < ApplicationController
  before_action :set_performance

  def index
    @q = @performance.performance_seats.ransack(params[:q])
    @performance_seats = @q.result
      .order(:section, :row_number, :seat_number)
      .page(params[:page])
      .per(50)
  end

  def new
    @performance_seat = @performance.performance_seats.new
  end

  def create
    @performance_seat = @performance.performance_seats.new(performance_seat_params)

    if @performance_seat.save
      redirect_to performance_performance_seats_path(@performance), notice: "座位创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_performance
    @performance = Performance.find(params[:performance_id])
  end

  def performance_seat_params
    params.require(:performance_seat).permit(:section, :row_number, :seat_number, :price_cents, :status)
  end
end
