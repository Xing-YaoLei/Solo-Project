class TicketType < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :performance
  has_many :tickets, dependent: :nullify

  validates :name, presence: true, length: { maximum: 100 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :sale_start_time, presence: true
  validates :sale_end_time, presence: true
  validates :max_quantity, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :min_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validate :sale_end_after_start
  validate :sale_period_within_performance

  enum :status, { inactive: "inactive", active: "active", sold_out: "sold_out", suspended: "suspended" }, default: :inactive

  enum :refund_policy, { no_refund: "no_refund", full_refund: "full_refund", partial_refund: "partial_refund" }, default: :no_refund

  aasm column: :status, enum: true do
    state :inactive, initial: true
    state :active
    state :sold_out
    state :suspended

    event :activate do
      transitions from: :inactive, to: :active
    end

    event :mark_sold_out do
      transitions from: :active, to: :sold_out
    end

    event :suspend do
      transitions from: :active, to: :suspended
    end

    event :reactivate do
      transitions from: %i[suspended sold_out], to: :active
    end
  end

  def self.export_scope_description
    "关联演出名称，按票种状态筛选"
  end

  def available_for_purchase?
    active? && Time.current.between?(sale_start_time, sale_end_time)
  end

  def sold_count
    tickets.where.not(status: :cancelled).count
  end

  def remaining_count
    max_quantity ? max_quantity - sold_count : nil
  end

  private

  def sale_end_after_start
    return unless sale_start_time && sale_end_time
    errors.add(:sale_end_time, "必须晚于开售时间") if sale_end_time <= sale_start_time
  end

  def sale_period_within_performance
    return unless sale_start_time && performance&.start_time
    if sale_start_time > performance.start_time
      errors.add(:sale_start_time, "不能晚于演出开始时间")
    end
  end
end
