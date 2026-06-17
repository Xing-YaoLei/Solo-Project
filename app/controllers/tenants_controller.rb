class TenantsController < ApplicationController
  before_action :set_tenant, only: %i[show edit update destroy]

  def index
    @tenants = Tenant.order(:name)
  end

  def show
    @contracts = @tenant.tenant_contracts.order(:start_date)
  end

  def new
    @tenant = Tenant.new
  end

  def create
    @tenant = Tenant.new(tenant_params)
    if @tenant.save
      redirect_to @tenant, notice: "租户创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @tenant.update(tenant_params)
      redirect_to @tenant, notice: "租户更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @tenant.destroy!
    redirect_to tenants_url, notice: "租户已删除"
  end

  private

  def set_tenant
    @tenant = Tenant.find(params[:id])
  end

  def tenant_params
    params.require(:tenant).permit(:name, :contact_person, :contact_phone, :email, :address, :remark)
  end
end
