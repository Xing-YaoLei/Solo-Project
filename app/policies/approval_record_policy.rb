class ApprovalRecordPolicy < ApplicationPolicy
  def index?
    cs? || city_manager?
  end

  def show?
    cs? || city_manager?
  end

  def approve?
    city_manager?
  end

  def reject?
    city_manager?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    if city_manager?
      [ :settlement_id, :approval_node_id, :approver_id, :decision, :comments ]
    else
      []
    end
  end
end
