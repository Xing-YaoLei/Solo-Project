class AuditPolicy < ApplicationPolicy
  def create?
    user.auditor? || user.supervisor? || user.admin?
  end

  def update?
    return true if user.admin?
    return true if user.supervisor?
    return true if record.creator_id == user.id

    if record.pending_approval? || record.approved?
      user.can_approve_audits?
    else
      false
    end
  end

  def transition?
    update?
  end

  def upload_evidence?
    return true if user.admin?
    return true if record.creator_id == user.id
    record.in_progress? || record.pending_evidence? || record.pending_checklist?
  end

  def manage_checklist?
    upload_evidence?
  end

  def approve?
    record.pending_approval? && user.can_approve_audits?
  end

  def reject?
    update?
  end

  def archive?
    record.approved? && user.can_approve_audits?
  end

  def export?
    user.supervisor? || user.admin?
  end

  def generate_notification?
    (user.supervisor? || user.admin?) && record.pending_notification?
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      elsif user.supervisor?
        scope.all
      else
        scope.by_creator(user.id)
      end
    end
  end
end
