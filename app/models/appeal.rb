class Appeal < ApplicationRecord
  include AASM

  enum :appeal_type, { refund: 0, makeup_exam: 1, extension: 2, complaint: 3, other: 4 }
  enum :status, { pending: 0, processing: 1, approved: 2, rejected: 3, closed: 4 }

  belongs_to :enrollment
  belongs_to :user
  belongs_to :handled_by, class_name: "User", optional: true

  validates :enrollment_id, presence: true
  validates :user_id, presence: true
  validates :appeal_type, presence: true
  validates :title, presence: true
  validates :content, presence: true

  delegate :course, to: :enrollment, allow_nil: true

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :processing
    state :approved
    state :rejected
    state :closed

    event :process_appeal do
      transitions from: :pending, to: :processing
    end

    event :approve do
      transitions from: [:pending, :processing], to: :approved
    end

    event :reject do
      transitions from: [:pending, :processing], to: :rejected
    end

    event :close do
      transitions from: [:approved, :rejected], to: :closed
    end
  end

  def appeal_no
    "AP#{created_at.strftime('%Y%m%d')}-#{id.to_s.rjust(6, '0')}"
  end

  def handle!(handler, result, approved: false)
    ActiveRecord::Base.transaction do
      update!(
        handled_by: handler,
        handled_at: Time.current,
        handle_result: result
      )

      if approved
        approve!
        process_approval
      else
        reject!
      end
    end
  end

  private

  def process_approval
    case appeal_type
    when "makeup_exam"
      create_makeup_exam
    when "extension"
      create_extension
    when "refund"
      process_refund
    end
  end

  def create_makeup_exam
    exam = enrollment.course.exams.first
    return unless exam

    enrollment.makeup_exams.create!(
      exam: exam,
      reason: content,
      status: :approved,
      approved_by: handled_by,
      approved_at: Time.current,
      expires_at: 30.days.from_now
    )
  end

  def create_extension
    return unless content.match?(/(\d+)\s*天/)
    days = content.match(/(\d+)\s*天/)[1].to_i
    return if days <= 0

    original_expired_at = enrollment.expired_at || 90.days.from_now

    enrollment.extensions.create!(
      reason: content,
      extend_days: days,
      original_expired_at: original_expired_at,
      new_expired_at: original_expired_at + days.days,
      status: :approved,
      approved_by: handled_by,
      approved_at: Time.current
    )

    enrollment.update!(expired_at: original_expired_at + days.days)
  end

  def process_refund
    order = enrollment.order
    return unless order&.paid?

    order.refund!
    enrollment.refund!
  end
end
