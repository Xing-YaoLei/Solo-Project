class RedemptionRecordPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    true
  end

  def edit?
    update?
  end

  def destroy?
    user.manager?
  end

  def redeem?
    true
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
