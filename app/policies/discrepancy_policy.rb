class DiscrepancyPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def update?
    cs? || city_manager?
  end

  def resolve?
    cs?
  end

  def escalate?
    cs?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      elsif user&.merchant?
        scope.joins(:settlement).where(settlements: { merchant_id: user.merchant_id })
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    base_attrs = [ :settlement_id, :description, :difference_amount, :status, :resolution ]
    if city_manager?
      base_attrs
    elsif cs?
      base_attrs - [ :settlement_id ]
    elsif merchant?
      base_attrs & [ :description ]
    else
      []
    end
  end
end
