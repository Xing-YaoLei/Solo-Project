class ParkingSpotsController < ApplicationController
  before_action :set_parking_spot, only: %i[show edit update destroy]

  def index
    @parking_spots = ParkingSpot.order(:zone, :spot_number)
    @parking_spots = @parking_spots.by_zone(params[:zone]) if params[:zone].present?
    @parking_spots = @parking_spots.available if params[:available] == "true"
  end

  def show
    @bills = @parking_spot.parking_bills.order(created_at: :desc).limit(10)
    @access_records = @parking_spot.access_records.recent.limit(10)
  end

  def new
    @parking_spot = ParkingSpot.new
  end

  def create
    @parking_spot = ParkingSpot.new(parking_spot_params)
    if @parking_spot.save
      redirect_to @parking_spot, notice: "车位创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @parking_spot.update(parking_spot_params)
      redirect_to @parking_spot, notice: "车位更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @parking_spot.destroy!
    redirect_to parking_spots_url, notice: "车位已删除"
  end

  private

  def set_parking_spot
    @parking_spot = ParkingSpot.find(params[:id])
  end

  def parking_spot_params
    params.require(:parking_spot).permit(:spot_number, :zone, :spot_type, :occupied, :floor, :monthly_rate)
  end
end
