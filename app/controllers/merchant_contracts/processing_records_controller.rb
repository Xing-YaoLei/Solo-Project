class MerchantContracts::ProcessingRecordsController < ApplicationController
  before_action :set_merchant_contract

  def index
    @processing_records = @merchant_contract.processing_records.recent.page(params[:page]).per(20)
  end

  def new
    @processing_record = @merchant_contract.processing_records.new
  end

  def create
    @processing_record = @merchant_contract.processing_records.new(processing_record_params)
    @processing_record.handler = current_user

    if @processing_record.save
      redirect_to @merchant_contract, notice: "处理记录创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_merchant_contract
    @merchant_contract = MerchantContract.find(params[:merchant_contract_id])
  end

  def processing_record_params
    params.require(:processing_record).permit(:action_type, :status, :notes)
  end
end
