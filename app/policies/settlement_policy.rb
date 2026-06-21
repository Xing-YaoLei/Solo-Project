class SettlementPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def submit_for_approval?
    cs?
  end

  def reject?
    cs? || city_manager?
  end

  def resubmit?
    cs?
  end

  def reassign?
    cs? || city_manager?
  end

  def supplement_material?
    cs?
  end

  def confirm?
    merchant?
  end

  def raise_dispute?
    merchant?
  end

  def approve?
    city_manager?
  end

  def export?
    cs? || city_manager?
  end

  class Scope < Scope
    def resolve
      if user&.city_manager?
        scope.all
      elsif user&.cs?
        scope.all
      elsif user&.merchant? && scope.respond_to?(:by_merchant)
        scope.by_merchant(user.merchant_id)
      elsif user&.rider?
        scope.none
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    base_attrs = [ :merchant_id, :period, :system_amount, :merchant_amount, :difference_amount, :status, :payment_date, :handler_id, :remarks ]
    if city_manager?
      base_attrs
    elsif cs?
      base_attrs - [ :handler_id ]
    elsif merchant?
      base_attrs - [ :merchant_id, :system_amount, :difference_amount, :handler_id, :status ]
    else
      []
    end
  end
end
