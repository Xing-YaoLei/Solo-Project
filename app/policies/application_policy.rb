# frozen_string_literal: true

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
    user.present? && (user.cs? || user.city_manager?)
  end

  def new?
    create?
  end

  def update?
    user.present? && (user.cs? || user.city_manager?)
  end

  def edit?
    update?
  end

  def destroy?
    user.present? && user.city_manager?
  end

  private

  def merchant?
    user&.merchant?
  end

  def rider?
    user&.rider?
  end

  def cs?
    user&.cs?
  end

  def city_manager?
    user&.city_manager?
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      elsif user&.merchant? && scope.respond_to?(:by_merchant)
        scope.by_merchant(user.merchant_id)
      elsif user&.rider? && scope.respond_to?(:by_rider)
        scope.by_rider(user.id)
      else
        scope.none
      end
    end

    private

    attr_reader :user, :scope
  end
end
