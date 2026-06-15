class RefundRecord < ApplicationRecord
  REFUND_STATUSES = %w[pending approved rejected completed cancelled].freeze
  REFUND_REASON_CODES = %w[course_unsatisfied personal_reason duplicate_payment financial_difficulty service_complaint other].freeze
  PAYMENT_METHODS = %w[wechat alipay bank_transfer cash credit_card].freeze

  belongs_to :student
  belongs_to :member_profile, optional: true
  belongs_to :operator, class_name: "User", optional: true

  validates :refund_status, inclusion: { in: REFUND_STATUSES }
  validates :refund_reason_code, inclusion: { in: REFUND_REASON_CODES }, allow_nil: true
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }, allow_nil: true
  validates :refund_amount, numericality: { greater_than: 0 }, allow_nil: true

  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) if start_date && end_date }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :by_status, ->(status) { where(refund_status: status) if status.present? }
  scope :by_reason, ->(reason_code) { where(refund_reason_code: reason_code) if reason_code.present? }
end
