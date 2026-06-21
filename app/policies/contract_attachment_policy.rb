class ContractAttachmentPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def show?
    user.present?
  end

  def create?
    cs? || merchant? || city_manager?
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
      elsif user&.merchant? && scope.respond_to?(:by_merchant)
        scope.by_merchant(user.merchant_id)
      else
        scope.none
      end
    end
  end

  def permitted_attributes
    base_attrs = [ :merchant_id, :file_name, :file_type, :file, :effective_date, :expiry_date, :uploader_id ]
    if city_manager?
      base_attrs
    elsif cs?
      base_attrs - [ :uploader_id ]
    elsif merchant?
      base_attrs - [ :merchant_id, :uploader_id ]
    else
      []
    end
  end
end
