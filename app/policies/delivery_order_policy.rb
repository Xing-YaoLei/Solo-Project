class DeliveryOrderPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  class Scope < Scope
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
  end
end
