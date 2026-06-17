class EquipmentDowntimesController < ApplicationController
  before_action :set_equipment_downtime, only: %i[show resolve add_action]

  def index
    @equipment_downtimes = EquipmentDowntime.recent
    @equipment_downtimes = @equipment_downtimes.where(status: params[:status]) if params[:status].present?
    @equipment_downtimes = @equipment_downtimes.where(equipment_type: params[:equipment_type]) if params[:equipment_type].present?
  end

  def show
    @downtime_actions = @equipment_downtime.downtime_actions.chronological
  end

  def new
    @equipment_downtime = EquipmentDowntime.new(started_at: Time.current)
  end

  def create
    @equipment_downtime = EquipmentDowntime.new(equipment_downtime_params)
    if @equipment_downtime.save
      redirect_to @equipment_downtime, notice: "设备停机记录已创建，相关角色已通知"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def resolve
    if @equipment_downtime.resolve!(
      resolved_by: params[:resolved_by] || current_operator_name,
      action_taken: params[:action_taken],
      closed_at: Time.current
    )
      redirect_to @equipment_downtime, notice: "设备停机已关闭"
    else
      redirect_to @equipment_downtime, alert: "关闭失败"
    end
  end

  def add_action
    action = @equipment_downtime.downtime_actions.build(
      action_description: params[:action_description],
      performed_by: params[:performed_by] || current_operator_name,
      performed_at: Time.current
    )
    if action.save
      redirect_to @equipment_downtime, notice: "处理动作已记录"
    else
      redirect_to @equipment_downtime, alert: "记录失败"
    end
  end

  private

  def set_equipment_downtime
    @equipment_downtime = EquipmentDowntime.find(params[:id])
  end

  def equipment_downtime_params
    params.require(:equipment_downtime).permit(
      :equipment_name, :equipment_type, :reason, :description, :started_at
    )
  end
end
