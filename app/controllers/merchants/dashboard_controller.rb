module Merchants
  class DashboardController < BaseController
    def index
      authorize Settlement, :index?

      @pending_settlements = policy_scope(Settlement).pending.count
      @approved_settlements = policy_scope(Settlement).approved.count
      @completed_settlements = policy_scope(Settlement).completed.count
      @rejected_settlements = policy_scope(Settlement).rejected.count
      @with_difference = policy_scope(Settlement).with_difference.count

      @recent_settlements = policy_scope(Settlement).recent.limit(10)
      @my_contract_attachments = policy_scope(ContractAttachment).recent.limit(5)

      @sensitive_fields = sensitive_fields_for(:merchant)
    end
  end
end
