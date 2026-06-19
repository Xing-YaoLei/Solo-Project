class OversellReviewPolicy < ApplicationPolicy
  def create?
    user.manager?
  end

  def new?
    create?
  end
end
