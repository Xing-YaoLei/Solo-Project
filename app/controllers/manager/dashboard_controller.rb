module Manager
  class DashboardController < BaseController
    def index
      authorize Settlement, :index?

      @pending_settlements = policy_scope(Settlement).pending.count
      @processing_settlements = policy_scope(Settlement).processing.count
      @approved_settlements = policy_scope(Settlement).approved.count
      @completed_settlements = policy_scope(Settlement).completed.count
      @with_difference = policy_scope(Settlement).with_difference.count
      @unresolved_discrepancies = policy_scope(Discrepancy).unresolved.count
      @pending_approvals = policy_scope(ApprovalRecord).pending.count

      @total_amount = policy_scope(Settlement).completed.sum(:merchant_amount)
      @this_month_amount = policy_scope(Settlement).completed.by_period(Date.today.strftime("%Y-%m")).sum(:merchant_amount)

      @recent_settlements = policy_scope(Settlement).recent.limit(10)
      @pending_approvals_list = policy_scope(ApprovalRecord).pending.includes(:settlement, :approver, :approval_node).recent.limit(10)
      @recent_discrepancies = policy_scope(Discrepancy).recent.limit(10)

      @sensitive_fields = sensitive_fields_for(:city_manager)
    end
  end
end
