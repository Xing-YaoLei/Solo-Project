class CheckInRecordPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.manager? || record.staff_id == user.id || record.order&.staff_id == user.id
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    user.manager? || record.staff_id == user.id || record.order&.staff_id == user.id
  end

  def edit?
    update?
  end

  def destroy?
    user.manager?
  end

  class Scope < Scope
    def resolve
      if user.manager?
        scope.all
      else
        scope.joins(:order).where("check_in_records.staff_id = ? OR orders.staff_id = ?", user.id, user.id)
      end
    end
  end
end
