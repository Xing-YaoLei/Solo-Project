class MonthlyTurnoverReport < ApplicationRecord
  validates :report_month, presence: true
  validates :generated_by, presence: true
  validates :filter_conditions, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :pending, -> { where(status: "pending") }
  scope :generating, -> { where(status: "generating") }
  scope :completed, -> { where(status: "completed") }
  scope :failed, -> { where(status: "failed") }

  def pending?
    status == "pending"
  end

  def generating?
    status == "generating"
  end

  def completed?
    status == "completed"
  end

  def failed?
    status == "failed"
  end

  def filter_conditions_hash
    filter_conditions || {}
  end

  def display_month
    report_month.strftime("%Y年%m月")
  end
end

