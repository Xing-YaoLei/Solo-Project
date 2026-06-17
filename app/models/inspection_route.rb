class InspectionRoute < ApplicationRecord
  has_many :inspection_checkpoints, dependent: :destroy

  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending in_progress completed cancelled] }
  validates :inspector_name, presence: true
  validates :scheduled_at, presence: true

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_date, ->(date) { where(scheduled_at: date.beginning_of_day..date.end_of_day) if date.present? }
  scope :recent, -> { order(scheduled_at: :desc) }
end
