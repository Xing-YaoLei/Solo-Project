class OversellReview < ApplicationRecord
  belongs_to :order
  belongs_to :reviewer, class_name: "User", optional: true

  enum :resolution, { pending: "pending",
                      refund: "refund",
                      upgrade: "upgrade",
                      alternative: "alternative",
                      resolved: "resolved",
                      rejected: "rejected" }

  validates :review_opinion, presence: true

  scope :pending_review, -> { where(resolution: :pending) }
  scope :reviewed, -> { where.not(resolution: :pending) }
  scope :latest_first, -> { order(created_at: :desc) }

  def complete!(resolution_type, reviewer = nil)
    update!(resolution: resolution_type, reviewer: reviewer, reviewed_at: Time.current)
  end
end
