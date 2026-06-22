class ExceptionOrderPolicy < ApplicationPolicy
  def create?
    user.auditor? || user.supervisor? || user.admin?
  end

  def show?
    return true if user.admin? || user.supervisor?
    return true if record.audit&.creator_id == user.id
    return true if record.handler_id == user.id
    false
  end

  def update?
    return true if user.admin?
    return true if user.supervisor?
    return true if record.handler_id == user.id
    record.audit&.creator_id == user.id && record.open?
  end

  def assign?
    user.supervisor? || user.admin?
  end

  def resolve?
    return true if user.admin?
    return true if user.supervisor?
    record.handler_id == user.id && record.in_progress?
  end

  def close?
    user.supervisor? || user.admin?
  end

  def reopen?
    user.supervisor? || user.admin?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.supervisor?
        scope.all
      else
        scope.where(handler_id: user.id)
          .or(scope.where(audit_id: Audit.where(creator_id: user.id).select(:id)))
      end
    end
  end
end
