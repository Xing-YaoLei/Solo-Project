class ChannelPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.manager?
  end

  def new?
    create?
  end

  def update?
    user.manager?
  end

  def edit?
    update?
  end

  def destroy?
    user.manager?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end
