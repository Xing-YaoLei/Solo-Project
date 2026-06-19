class OrderPolicy < ApplicationPolicy
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

  def confirm?
    true
  end

  def cancel?
    true
  end

  def check_in?
    true
  end

  def complete?
    true
  end

  def oversold_index?
    user.manager?
  end

  class Scope < Scope
    def resolve
      if user.manager?
        scope.all
      else
        scope.by_staff(user.id)
      end
    end
  end
end
