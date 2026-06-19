class OversellCommunicationPolicy < ApplicationPolicy
  def create?
    user.manager? || record&.order&.staff_id == user.id
  end

  def new?
    create?
  end
end
