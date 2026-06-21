class CommonlyUsedMaterialsController < ApplicationController
  def index
    @materials = CommonlyUsedMaterial.active.includes(:part).sorted
    @materials_by_category = @materials.group_by(&:category)
  end

  def create
    @material = CommonlyUsedMaterial.new(commonly_used_material_params)

    if @material.save
      redirect_to commonly_used_materials_path, notice: "常用材料添加成功。"
    else
      redirect_to commonly_used_materials_path, alert: @material.errors.full_messages.join(", ")
    end
  end

  def destroy
    @material = CommonlyUsedMaterial.find(params[:id])
    @material.destroy
    redirect_to commonly_used_materials_path, notice: "常用材料已移除。"
  end

  private

  def commonly_used_material_params
    params.require(:commonly_used_material