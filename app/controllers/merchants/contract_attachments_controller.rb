module Merchants
  class ContractAttachmentsController < BaseController
    before_action :set_contract_attachment, only: [ :show ]

    def index
      authorize ContractAttachment, :index?

      @q = policy_scope(ContractAttachment).ransack(params[:q])
      @contract_attachments = @q.result.includes(:uploader)
                                  .recent.page(params[:page])

      @active_count = policy_scope(ContractAttachment).active.count
      @expired_count = policy_scope(ContractAttachment).expired.count
    end

    def show
      authorize @contract_attachment, :show?
    end

    def create
      authorize ContractAttachment, :create?

      @contract_attachment = ContractAttachment.new(contract_attachment_params)
      @contract_attachment.merchant = current_user.merchant
      @contract_attachment.uploader = current_user

      if @contract_attachment.save
        redirect_to merchants_contract_attachments_path, notice: "合同附件已上传。"
      else
        @q = policy_scope(ContractAttachment).ransack(params[:q])
        @contract_attachments = @q.result.includes(:uploader).recent.page(params[:page])
        render :index
      end
    end

    private

    def set_contract_attachment
      @contract_attachment = policy_scope(ContractAttachment).find(params[:id])
    end

    def contract_attachment_params
      params.require(:contract_attachment).permit(policy(ContractAttachment).permitted_attributes)
    end
  end
end
