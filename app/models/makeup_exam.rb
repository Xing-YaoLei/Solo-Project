class MakeupExam < ApplicationRecord
  include AASM

  enum :status, { pending: 0, approved: 1, rejected: 2, used: 3, expired: 4 }

  belongs_to :enrollment
  belongs_to :exam
  belongs_to :exam_record, optional: true
  belongs_to :approved_by, class_name: "User", optional: true

  validates :enrollment_id, presence: true
  validates :exam_id, presence: true

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :approved
    state :rejected
    state :used
    state :expired

    event :approve do
      transitions from: :pending, to: :approved
    end

    event :reject do
      transitions from: :pending, to: :rejected
    end

    event :use do
      transitions from: :approved, to: :used
    end

    event :expire do
      transitions from: :approved, to: :expired
    end
  end

  def available?
    approved? && !expired?
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end
end
