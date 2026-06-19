class OrderPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.manager? || record.staff_id == user.id
  end

  def create?
    true
  end

  def new?
    create?
  end

  def update?
    user.manager? || record.staff_id == user.id
  end

  def edit?
    update?
  end

  def destroy?
    user.manager?
  end

  def confirm?
    user.manager? || record.staff_id == user.id
  end

  def cancel?
    user.manager? || record.staff_id == user.id
  end

  def check_in?
    user.manager? || record.staff_id == user.id
  end

  def complete?
    user.manager? || record.staff_id == user.id
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
