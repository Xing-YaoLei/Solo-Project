class TenantContractsController < ApplicationController
  before_action :set_tenant_contract, only: %i[show edit update destroy audit_trail]

  def index
    @tenant_contracts = TenantContract.includes(:tenant, :parking_spot).order(:start_date)
    @tenant_contracts = @tenant_contracts.active if params[:scope] == "active"
    @tenant_contracts = @tenant_contracts.expired if params[:scope] == "expired"
  end

  def show
  end

  def new
    @tenant_contract = TenantContract.new
  end

  def create
    @tenant_contract = TenantContract.new(tenant_contract_params)
    @tenant_contract.operator_id = session[:operator_id]
    if @tenant_contract.save
      redirect_to @tenant_contract, notice: "合同创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    @tenant_contract.operator_id = session[:operator_id]
    if @tenant_contract.update(tenant_contract_params)
      redirect_to @tenant_contract, notice: "合同更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @tenant_contract.operator_id = session[:operator_id]
    @tenant_contract.destroy!
    redirect_to tenant_contracts_url, notice: "合同已删除"
  end

  def audit_trail
    @versions = @tenant_contract.versions.order(created_at: :desc)
  end

  private

  def set_tenant_contract
    @tenant_contract = TenantContract.find(params[:id])
  end

  def tenant_contract_params
    params.require(:tenant_contract).permit(
      :contract_number, :tenant_id, :parking_spot_id,
      :start_date, :end_date, :rent_amount, :status, :terms
    )
  end
end
