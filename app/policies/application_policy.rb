class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    user.present?
  end

  def new?
    create?
  end

  def update?
    user.present? && (user.admin? || owner_or_creator?)
  end

  def edit?
    update?
  end

  def destroy?
    user.admin?
  end

  def search?
    index?
  end

  def export?
    user.supervisor? || user.admin?
  end

  private

  def owner_or_creator?
    if record.respond_to?(:creator_id)
      record.creator_id == user.id
    elsif record.respond_to?(:user_id)
      record.user_id == user.id
    elsif record.respond_to?(:handler_id)
      record.handler_id == user.id
    else
      false
    end
  end

  def record_scope
    Pundit.policy_scope!(user, record.class)
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if user.admin?
        scope.all
      elsif user.supervisor?
        scope.all
      else
        if scope.respond_to?(:by_creator)
          scope.by_creator(user.id)
        elsif scope.respond_to?(:by_user)
          scope.by_user(user.id)
        elsif scope.respond_to?(:by_handler)
          scope.by_handler(user.id).or(scope.where(handler_id: nil))
        else
          scope.all
        end
      end
    end
  end
end
