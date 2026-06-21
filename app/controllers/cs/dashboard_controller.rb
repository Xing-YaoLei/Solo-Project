module Cs
  class DashboardController < BaseController
    def index
      authorize Settlement, :index?

      @pending_settlements = policy_scope(Settlement).pending.count
      @processing_settlements = policy_scope(Settlement).processing.count
      @approved_settlements = policy_scope(Settlement).approved.count
      @completed_settlements = policy_scope(Settlement).completed.count
      @with_difference = policy_scope(Settlement).with_difference.count
      @unresolved_discrepancies = policy_scope(Discrepancy).unresolved.count
      @pending_todo_items = policy_scope(TodoItem).incomplete.count

      @recent_settlements = policy_scope(Settlement).recent.limit(10)
      @recent_discrepancies = policy_scope(Discrepancy).recent.limit(10)
      @my_todo_items = policy_scope(TodoItem).by_assignee(current_user.id).incomplete.ordered_by_priority.limit(10)

      @sensitive_fields = sensitive_fields_for(:cs)
    end
  end
end
