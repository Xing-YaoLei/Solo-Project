class MonthlyTurnoverReport < ApplicationRecord
  validates :report_month, presence: true
  validates :generated_by, presence: true
  validates :filter_conditions, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def filter_conditions_hash
    super || {}
  end

  def display_month
    report_month.strftime("%Y年%m月")
  end
end
