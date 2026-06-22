class NotificationPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    record.user_id == user.id
  end

  def update?
    record.user_id == user.id
  end

  def mark_all_read?
    user.present?
  end

  class Scope < Scope
    def resolve
      scope.by_user(user.id)
    end
  end
end
