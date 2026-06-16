class EquipmentMaintenancesController < ApplicationController
  def create
    @equipment = Equipment.find(params[:equipment_id])
    @maintenance = @equipment.equipment_maintenances.build(maintenance_params)

    if @maintenance.save
      redirect_to @equipment, notice: "维护记录添加成功"
    else
      @maintenances = @equipment.equipment_maintenances.includes(:performer).order(performed_at: :desc)
      render "equipment/show", status: :unprocessable_entity
    end
  end

  private

  def maintenance_params
    params.require(:equipment_maintenance).permit(:maintenance_type, :description, :performed_at, :performer_id)
  end
end
