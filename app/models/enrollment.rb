class Enrollment < ApplicationRecord
  include AASM

  enum :status, { enrolled: 0, studying: 1, completed: 2, expired: 3, refunded: 4 }

  belongs_to :user
  belongs_to :course
  belongs_to :channel
  belongs_to :order, optional: true

  has_many :lesson_progresses, dependent: :destroy
  has_many :completed_lessons, -> { where(lesson_progresses: { status: :completed }) }, through: :lesson_progresses, source: :lesson
  has_many :practice_records, dependent: :destroy
  has_many :exam_records, dependent: :destroy
  has_many :follow_ups, dependent: :destroy
  has_many :appeals, dependent: :destroy
  has_many :makeup_exams, dependent: :destroy
  has_many :extensions, dependent: :destroy
  has_many :qa_threads, dependent: :destroy
  has_many :certificate_issuances, dependent: :destroy
  has_many :settlement_items, dependent: :nullify

  validates :user_id, presence: true
  validates :course_id, presence: true
  validates :channel_id, presence: true

  aasm column: :status, enum: true do
    state :enrolled, initial: true
    state :studying
    state :completed
    state :expired
    state :refunded

    event :start_learning do
      transitions from: :enrolled, to: :studying
    end

    event :complete do
      transitions from: :studying, to: :completed
    end

    event :expire do
      transitions from: [:enrolled, :studying], to: :expired
    end

    event :refund do
      transitions from: [:enrolled, :studying], to: :refunded
    end
  end

  def update_progress!
    total = course.lessons.active.count
    completed = lesson_progresses.completed.count
    progress = total > 0 ? (completed.to_f / total * 100).round(2) : 0

    update(
      progress: progress,
      completed_lessons_count: completed,
      total_lessons_count: total
    )

    complete! if progress >= 100 && may_complete?
    progress
  end

  def exam_passed?
    exam_records.where(is_passed: true).exists?
  end

  def latest_exam_record
    exam_records.order(created_at: :desc).first
  end

  def remaining_days
    return 0 if expired_at.blank?
    days = (expired_at.to_date - Date.current).to_i
    [days, 0].max
  end

  def expired?
    return false if expired_at.blank?
    expired_at < Time.current
  end

  def behind_schedule?
    return false if total_lessons_count.to_i == 0
    return false if enrolled_at.blank?

    days_elapsed = (Date.current - enrolled_at.to_date).to_i
    return false if days_elapsed <= 0

    expected_daily_rate = total_lessons_count.to_f / 30.0
    expected_progress = [days_elapsed * expected_daily_rate, total_lessons_count].min
    actual_progress = completed_lessons_count.to_i

    actual_progress < expected_progress * 0.7
  end

  def certificate_eligible?
    completed? && exam_passed?
  end

  def issue_certificate!(certificate)
    return unless certificate_eligible?
    return if certificate_issued

    certificate_issuances.create!(
      certificate: certificate,
      user: user,
      issued_at: Time.current,
      certificate_no: generate_certificate_no,
      status: :issued
    )
    update(certificate_issued: true)
  end

  def can_take_exam?(exam)
    return false if exam.blank?
    return false unless studying? || completed?

    attempts = exam_records.where(exam: exam).count
    attempts < exam.attempt_limit
  end

  def exam_attempts
    exam_records.count
  end

  def progress_percentage
    progress.to_i
  end

  def certificate_issued?
    certificate_issued
  end

  private

  def generate_certificate_no
    "CERT-#{Time.current.strftime('%Y%m%d')}-#{id.to_s.rjust(6, '0')}"
  end
end
