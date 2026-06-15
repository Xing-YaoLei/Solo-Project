class RedemptionRecord < ApplicationRecord
  STATUSES = %w[pending completed cancelled expired].freeze
  CHANNELS = %w[online offline community_center app].freeze

  belongs_to :student
  belongs_to :benefit_rule, optional: true
  belongs_to :operator, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUSES }
  validates :channel, inclusion: { in: CHANNELS }, allow_nil: true

  scope :by_date_range, ->(start_date, end_date) { where(redeemed_at: start_date..end_date) if start_date && end_date }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :completed, -> { where(status: "completed") }

  before_validation :set_redemption_code, on: :create

  private

  def set_redemption_code
    self.redemption_code ||= "R#{Time.current.strftime('%Y%m%d%H%M%S')}#{rand(1000..9999)}"
  end
end
