class SupplementMaterialPolicy < ApplicationPolicy
  def index?
    cs? || city_manager?
  end

  def show?
    cs? || city_manager? || merchant?
  end

  def create?
    cs? || city_manager?
  end

  def destroy?
    cs? || city_manager?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      elsif user&.merchant?
        scope.joins(discrepancy: :settlement).where(settlements: { merchant_id: user.merchant_id })
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    [ :discrepancy_id, :description, :file_url, :metadata ]
  end
end
