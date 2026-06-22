class SupplierPolicy < ApplicationPolicy
  def create?
    user.auditor? || user.supervisor? || user.admin?
  end

  def update?
    user.admin? || user.supervisor? || record.created_by_id == user.id
  end

  def manage_materials?
    update?
  end

  def manage_permissions?
    user.admin? || user.supervisor?
  end

  def audit_history?
    show?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.supervisor?
        scope.all
      else
        scope.where(created_by_id: user.id).or(scope.where(status: :active))
      end
    end
  end
end
