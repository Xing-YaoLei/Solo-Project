class ApprovalNodePolicy < ApplicationPolicy
  def index?
    city_manager?
  end

  def show?
    city_manager?
  end

  def new?
    city_manager?
  end

  def create?
    city_manager?
  end

  def edit?
    city_manager?
  end

  def update?
    city_manager?
  end

  def destroy?
    city_manager?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    if city_manager?
      [ :name, :order, :approver_role, :threshold_amount, :parent_id, :active ]
    else
      []
    end
  end
end
