class Sponsor < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  has_many :sponsorships, dependent: :destroy
  has_many :performances, through: :sponsorships

  validates :name, presence: true, length: { maximum: 200 }
  validates :contact_person, length: { maximum: 100 }, allow_nil: true
  validates :contact_phone, length: { maximum: 20 }, allow_nil: true
  validates :contact_email, length: { maximum: 200 }, allow_nil: true

  enum :status, { prospective: "prospective", active: "active", inactive: "inactive" }, default: :prospective

  aasm column: :status, enum: true do
    state :prospective, initial: true
    state :active
    state :inactive

    event :activate do
      transitions from: :prospective, to: :active
    end

    event :deactivate do
      transitions from: :active, to: :inactive
    end

    event :reactivate do
      transitions from: :inactive, to: :active
    end
  end

  def self.export_scope_description
    "按赞助商状态筛选，包含关联赞助记录"
  end

  def total_sponsorship_amount
    sponsorships.sum(:amount)
  end
end
