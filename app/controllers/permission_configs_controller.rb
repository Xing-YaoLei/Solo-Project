class PermissionConfigsController < ApplicationController
  before_action :set_supplier
  before_action :set_permission, only: [:update, :destroy]

  def create
    authorize @supplier, :manage_permissions?

    @permission = @supplier.permission_configs.new(permission_params)
    @permission.granted_by = current_user

    if @permission.save
      respond_to do |format|
        format.html { redirect_to supplier_path(@supplier), notice: "权限配置添加成功" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.prepend("permissions_list", partial: "permission_configs/permission_row", locals: { permission: @permission }),
            *render_turbo_flash(notice: "权限配置添加成功")
          ]
        end
      end
    else
      handle_error
    end
  end

  def update
    authorize @supplier, :manage_permissions?

    if @permission.update(permission_params)
      respond_to do |format|
        format.html { redirect_to supplier_path(@supplier), notice: "权限配置更新成功" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(dom_id(@permission), partial: "permission_configs/permission_row", locals: { permission: @permission }),
            *render_turbo_flash(notice: "权限配置更新成功")
          ]
        end
      end
    else
      handle_error
    end
  end

  def destroy
    authorize @supplier, :manage_permissions?

    @permission.destroy

    respond_to do |format|
      format.html { redirect_to supplier_path(@supplier), notice: "权限配置已删除" }
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(dom_id(@permission)),
          *render_turbo_flash(notice: "权限配置已删除")
        ]
      end
    end
  end

  private

  def set_supplier
    @supplier = Supplier.find(params[:supplier_id])
  end

  def set_permission
    @permission = @supplier.permission_configs.find(params[:id])
  end

  def permission_params
    params.require(:permission_config).permit(:permission_type, :is_active, access_scope: {})
  end

  def handle_error
    respond_to do |format|
      format.html do
        redirect_to supplier_path(@supplier), alert: "操作失败"
      end
      format.turbo_stream do
        render turbo_stream: render_turbo_flash(alert: "操作失败")
      end
    end
  end
end
