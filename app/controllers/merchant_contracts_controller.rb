class MerchantContractsController < ApplicationController
  before_action :set_merchant_contract, only: [:show, :edit, :update, :destroy]

  def index
    @q = MerchantContract.ransack(params[:q])
    @merchant_contracts = @q.result.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @processing_records = @merchant_contract.processing_records.recent.page(params[:page]).per(10)
    @secondary_consumptions = @merchant_contract.secondary_consumptions.recent.page(params[:consumption_page]).per(20)
    @total_consumption = @merchant_contract.total_consumption_amount
  end

  def new
    @merchant_contract = MerchantContract.new
  end

  def edit
  end

  def create
    @merchant_contract = MerchantContract.new(merchant_contract_params)

    if @merchant_contract.save
      ProcessingRecord.create!(
        recordable: @merchant_contract,
        handler: current_user,
        action_type: "创建",
        status: :completed,
        notes: "创建商户合同"
      )
      redirect_to @merchant_contract, notice: "商户合同创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @merchant_contract.update(merchant_contract_params)
      ProcessingRecord.create!(
        recordable: @merchant_contract,
        handler: current_user,
        action_type: "更新",
        status: :completed,
        notes: "更新商户合同信息"
      )
      redirect_to @merchant_contract, notice: "商户合同更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @merchant_contract.destroy
    redirect_to merchant_contracts_url, notice: "商户合同已删除。", status: :see_other
  end

  private

  def set_merchant_contract
    @merchant_contract = MerchantContract.find(params[:id])
  end

  def merchant_contract_params
    params.require(:merchant_contract).permit(
      :merchant_name, :contract_number, :start_date, :end_date,
      :amount_cents, :commission_rate, :status, :category,
      :contact_person, :contact_phone, :terms, :shop_location
    )
  end
end
