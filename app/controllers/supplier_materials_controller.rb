class SupplierMaterialsController < ApplicationController
  before_action :set_supplier
  before_action :set_material, only: [:update, :destroy]

  def create
    authorize @supplier, :manage_materials?

    @material = @supplier.materials.new(material_params)
    @material.uploaded_by = current_user

    if @material.save
      respond_to do |format|
        format.html { redirect_to supplier_path(@supplier), notice: "材料添加成功" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.prepend("materials_list", partial: "supplier_materials/material_row", locals: { material: @material }),
            turbo_stream.replace("materials_stats", partial: "suppliers/materials_stats", locals: { supplier: @supplier.reload }),
            *render_turbo_flash(notice: "材料添加成功")
          ]
        end
      end
    else
      handle_material_error
    end
  end

  def update
    authorize @supplier, :manage_materials?

    if @material.update(material_params)
      respond_to do |format|
        format.html { redirect_to supplier_path(@supplier), notice: "材料更新成功" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(dom_id(@material), partial: "supplier_materials/material_row", locals: { material: @material }),
            turbo_stream.replace("materials_stats", partial: "suppliers/materials_stats", locals: { supplier: @supplier.reload }),
            *render_turbo_flash(notice: "材料更新成功")
          ]
        end
      end
    else
      handle_material_error
    end
  end

  def destroy
    authorize @supplier, :manage_materials?

    @material.destroy

    respond_to do |format|
      format.html { redirect_to supplier_path(@supplier), notice: "材料已删除" }
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(dom_id(@material)),
          turbo_stream.replace("materials_stats", partial: "suppliers/materials_stats", locals: { supplier: @supplier.reload }),
          *render_turbo_flash(notice: "材料已删除")
        ]
      end
    end
  end

  private

  def set_supplier
    @supplier = Supplier.find(params[:supplier_id])
  end

  def set_material
    @material = @supplier.materials.find(params[:id])
  end

  def material_params
    params.require(:supplier_material).permit(:material_type, :name, :status, :expire_at, :remark)
  end

  def handle_material_error
    respond_to do |format|
      format.html do
        redirect_to supplier_path(@supplier), alert: "操作失败：#{@material.errors.full_messages.join('，')}"
      end
      format.turbo_stream do
        render turbo_stream: render_turbo_flash(alert: "操作失败：#{@material.errors.full_messages.join('，')}")
      end
    end
  end
end
