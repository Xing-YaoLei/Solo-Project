class SeatsController < ApplicationController
  before_action :set_performance
  before_action :set_seat, only: %i[edit update destroy]

  def index
    @seats = @performance.seats.order(:section, :row, :seat_number)
    @seats = @seats.where(status: params[:status]) if params[:status].present?
    @seats = @seats.where(section: params[:section]) if params[:section].present?
    @seats = paginate(@seats, per_page: 50)
  end

  def new
    @seat = @performance.seats.build
  end

  def create
    @seat = @performance.seats.build(seat_params)
    if @seat.save
      redirect_to performance_seats_url(@performance), notice: "座位创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @seat.update(seat_params)
      redirect_to performance_seats_url(@performance), notice: "座位更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @seat.destroy
    redirect_to performance_seats_url(@performance), notice: "座位已删除"
  end

  private

  def set_performance
    @performance = Performance.find(params[:performance_id])
  end

  def set_seat
    @seat = @performance.seats.find(params[:id])
  end

  def seat_params
    params.require(:seat).permit(:row, :seat_number, :section, :price, :status)
  end
end
