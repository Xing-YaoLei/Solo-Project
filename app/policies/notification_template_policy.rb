class NotificationTemplatePolicy < ApplicationPolicy
  def index?
    user.supervisor? || user.admin?
  end

  def create?
    user.supervisor? || user.admin?
  end

  def update?
    user.supervisor? || user.admin?
  end

  def destroy?
    user.admin?
  end

  def activate?
    update?
  end

  def deactivate?
    update?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
