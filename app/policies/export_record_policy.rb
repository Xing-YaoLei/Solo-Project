class ExportRecordPolicy < ApplicationPolicy
  def create?
    user.supervisor? || user.admin? || user.auditor?
  end

  def show?
    return true if user.admin?
    record.user_id == user.id
  end

  def download?
    show? && record.downloadable?
  end

  def destroy?
    return true if user.admin?
    record.user_id == user.id
  end

  class Scope < Scope
    def resolve
      if user.admin?
        scope.all
      else
        scope.by_user(user.id)
      end
    end
  end
end
