class MemberProfile < ApplicationRecord
  MEMBER_LEVELS = %w[basic premium vip].freeze
  PAYMENT_STATUSES = %w[unpaid paid partially_paid refunded].freeze

  belongs_to :student
  has_many :refund_records, dependent: :nullify

  validates :member_level, inclusion: { in: MEMBER_LEVELS }
  validates :payment_status, inclusion: { in: PAYMENT_STATUSES }

  scope :expired, -> { where("membership_end_date < ?", Date.current) }
  scope :active, -> { where("membership_end_date >= ?", Date.current) }
  scope :by_level, ->(level) { where(member_level: level) if level.present? }

  def active?
    membership_end_date >= Date.current
  end

  def days_remaining
    return 0 unless active?
    (membership_end_date - Date.current).to_i
  end
end
