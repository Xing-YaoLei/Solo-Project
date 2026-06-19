class RedemptionRecordPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.manager? || record.staff_id == user.id || record.order&.staff_id == user.id
  end

  def create?
    user.manager? || record.order&.staff_id == user.id
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

  def redeem?
    user.manager? || record.order&.staff_id == user.id
  end

  class Scope < Scope
    def resolve
      if user.manager?
        scope.all
      else
        scope.joins(:order).where("redemption_records.staff_id = ? OR orders.staff_id = ?", user.id, user.id)
      end
    end
  end
end
