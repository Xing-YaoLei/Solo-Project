class InspectionRoutesController < ApplicationController
  before_action :set_inspection_route, only: %i[show edit update destroy]

  def index
    @inspection_routes = InspectionRoute.recent
    @inspection_routes = @inspection_routes.by_status(params[:status]) if params[:status].present?
    @inspection_routes = @inspection_routes.by_date(params[:date]) if params[:date].present?
  end

  def show
    @checkpoints = @inspection_route.inspection_checkpoints.ordered
  end

  def new
    @inspection_route = InspectionRoute.new
  end

  def create
    @inspection_route = InspectionRoute.new(inspection_route_params)
    if @inspection_route.save
      redirect_to @inspection_route, notice: "巡检路线创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @inspection_route.update(inspection_route_params)
      redirect_to @inspection_route, notice: "巡检路线更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @inspection_route.destroy!
    redirect_to inspection_routes_url, notice: "巡检路线已删除"
  end

  private

  def set_inspection_route
    @inspection_route = InspectionRoute.find(params[:id])
  end

  def inspection_route_params
    params.require(:inspection_route).permit(:name, :inspector_name, :scheduled_at, :status, :notes)
  end
end
