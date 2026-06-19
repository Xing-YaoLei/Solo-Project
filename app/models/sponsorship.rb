class Sponsorship < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :sponsor
  belongs_to :performance

  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :sponsorship_type, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validate :end_date_after_start_date

  enum :status, { pending: "pending", active: "active", completed: "completed", terminated: "terminated" }, default: :pending

  enum :sponsorship_type, { title_sponsor: "title_sponsor", co_sponsor: "co_sponsor", venue_sponsor: "venue_sponsor", media_sponsor: "media_sponsor", other: "other" }

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :active
    state :completed
    state :terminated

    event :activate do
      transitions from: :pending, to: :active
    end

    event :complete do
      transitions from: :active, to: :completed
    end

    event :terminate do
      transitions from: %i[pending active], to: :terminated
    end
  end

  def self.export_scope_description
    "按赞助类型与状态筛选，关联赞助商名称与演出名称"
  end

  private

  def end_date_after_start_date
    return unless start_date && end_date
    errors.add(:end_date, "必须晚于开始日期") if end_date <= start_date
  end
end
