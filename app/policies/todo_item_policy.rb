class TodoItemPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def update?
    cs? || city_manager? || record.assignee_id == user.id
  end

  def batch_reassign?
    cs? || city_manager?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      elsif user&.merchant?
        scope.none
      elsif user&.rider? && scope.respond_to?(:by_assignee)
        scope.by_assignee(user.id)
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    base_attrs = [ :title, :description, :priority, :status, :due_date, :assignee_id, :assigner_id, :settlement_id, :discrepancy_id ]
    if city_manager?
      base_attrs
    elsif cs?
      base_attrs - [ :assigner_id ]
    elsif rider?
      base_attrs & [ :status ]
    else
      []
    end
  end
end
