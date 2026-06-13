class AfterSalesProofsController < ApplicationController
  before_action :require_user
  before_action :set_after_sales_proof, only: [:update, :destroy]

  def create
    pickup_order_id = params[:pickup_order_id] || params.dig(:after_sales_proof, :pickup_order_id)
    @pickup_order = PickupOrder.find(pickup_order_id)
    @after_sales_proof = @pickup_order.after_sales_proofs.new(after_sales_proof_params)
    @after_sales_proof.uploaded_by = current_user
    if @after_sales_proof.save
      @pickup_order.log_activity('upload_proof', user: current_user, details: "上传凭证: #{@after_sales_proof.proof_type}")
      redirect_to @pickup_order, notice: '凭证上传成功'
    else
      redirect_to @pickup_order, alert: @after_sales_proof.errors.full_messages.join(', ')
    end
  end

  def update
    if @after_sales_proof.update(after_sales_proof_params)
      redirect_to @after_sales_proof.pickup_order, notice: '凭证更新成功'
    else
      redirect_to @after_sales_proof.pickup_order, alert: @after_sales_proof.errors.full_messages.join(', ')
    end
  end

  def destroy
    @pickup_order = @after_sales_proof.pickup_order
    @after_sales_proof.destroy
    redirect_to @pickup_order, notice: '凭证已删除'
  end

  private

  def set_after_sales_proof
    @after_sales_proof = AfterSalesProof.find(params[:id])
  end

  def after_sales_proof_params
    params.require(:after_sales_proof).permit(:proof_type, :description, :document, :pickup_item_id)
  end
end
