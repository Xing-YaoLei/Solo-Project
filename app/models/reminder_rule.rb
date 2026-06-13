class ReminderRule < ApplicationRecord
  belongs_to :course_consumption

  validates :rule_type, presence: true

  RULE_TYPES = %w[progress_delay no_feedback session_timeout abnormal_status].freeze
  NOTIFICATION_METHODS = %w[system sms email wechat all].freeze

  scope :enabled, -> { where(enabled: true) }
end
