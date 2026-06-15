class Extension < ApplicationRecord
  include AASM

  enum :status, { pending: 0, approved: 1, rejected: 2 }

  belongs_to :enrollment
  belongs_to :approved_by, class_name: "User", optional: true

  validates :enrollment_id, presence: true
  validates :extend_days, presence: true, numericality: { greater_than: 0 }

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :approved
    state :rejected

    event :approve do
      transitions from: :pending, to: :approved
    end

    event :reject do
      transitions from: :pending, to: :rejected
    end
  end
end
