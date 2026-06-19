class HeatPointsController < ApplicationController
  before_action :set_heat_point, only: [:show, :edit, :update, :destroy]

  def index
    @q = HeatPoint.ransack(params[:q])
    @heat_points = @q.result.page(params[:page]).per(20)
  end

  def show
    @processing_records = @heat_point.processing_records.recent.page(params[:page]).per(10)
  end

  def new
    @heat_point = HeatPoint.new
  end

  def edit
  end

  def create
    @heat_point = HeatPoint.new(heat_point_params)

    if @heat_point.save
      ProcessingRecord.create!(
        recordable: @heat_point,
        handler: current_user,
        action_type: "创建",
        status: :completed,
        notes: "创建热力点位"
      )
      redirect_to @heat_point, notice: "热力点位创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @heat_point.update(heat_point_params)
      ProcessingRecord.create!(
        recordable: @heat_point,
        handler: current_user,
        action_type: "更新",
        status: :completed,
        notes: "更新热力点位信息"
      )
      redirect_to @heat_point, notice: "热力点位更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @heat_point.destroy
    redirect_to heat_points_url, notice: "热力点位已删除。", status: :see_other
  end

  private

  def set_heat_point
    @heat_point = HeatPoint.find(params[:id])
  end

  def heat_point_params
    params.require(:heat_point).permit(:name, :latitude, :longitude, :heat_level, :zone, :description, :status, :category)
  end
end
