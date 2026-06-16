class EquipmentController < ApplicationController
  before_action :set_equipment, only: [:show, :edit, :update]

  def index
    @equipment = Equipment.includes(:area, :equipment_maintenances)
    @equipment = @equipment.by_status(params[:status]) if params[:status].present?
    @equipment = @equipment.by_area(params[:area_id]) if params[:area_id].present?
    @equipment = @equipment.order(created_at: :desc)
    @areas = Area.all
  end

  def show
    @maintenances = @equipment.equipment_maintenances.includes(:performer).order(performed_at: :desc)
    @maintenance = @equipment.equipment_maintenances.build
  end

  def new
    @equipment = Equipment.new
    @areas = Area.all
  end

  def create
    @equipment = Equipment.new(equipment_params)
    if @equipment.save
      redirect_to equipment_index_path, notice: "设备创建成功"
    else
      @areas = Area.all
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @areas = Area.all
  end

  def update
    if @equipment.update(equipment_params)
      redirect_to @equipment, notice: "设备更新成功"
    else
      @areas = Area.all
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_equipment
    @equipment = Equipment.find(params[:id])
  end

  def equipment_params
    params.require(:equipment).permit(:name, :code, :category, :status, :area_id, :last_maintenance_date)
  end
end
