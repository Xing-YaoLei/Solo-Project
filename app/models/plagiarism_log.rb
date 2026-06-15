class PlagiarismLog < ApplicationRecord
  STATUSES = %w[open investigating resolved closed dismissed].freeze
  ACTIONS = %w[warning zero_score suspension expulsion retraining none].freeze

  belongs_to :assignment_submission
  belongs_to :student
  belongs_to :assignment, optional: true
  belongs_to :source_submission, class_name: "AssignmentSubmission", optional: true
  belongs_to :responsible_user, class_name: "User", optional: true
  belongs_to :handler, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUSES }
  validates :action_taken, inclusion: { in: ACTIONS }, allow_nil: true

  scope :open, -> { where(status: "open") }
  scope :by_student, ->(student_id) { where(student_id: student_id) if student_id.present? }
  scope :by_responsible, ->(user_id) { where(responsible_user_id: user_id) if user_id.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :unresolved, -> { where(status: %w[open investigating]) }

  after_create :notify_responsible_user
  after_update :record_closure, if: :just_closed?

  def resolve(action, notes = nil, handler = nil)
    update(
      status: "resolved",
      action_taken: action,
      resolution_notes: notes,
      resolved_at: Time.current,
      handler: handler
    )
  end

  def close(notes = nil, handler = nil)
    update(
      status: "closed",
      resolution_notes: notes,
      closed_at: Time.current,
      handler: handler
    )
  end

  def dismiss(notes = nil, handler = nil)
    update(
      status: "dismissed",
      resolution_notes: notes,
      closed_at: Time.current,
      handler: handler
    )
  end

  private

  def notify_responsible_user
    return unless responsible_user
    PlagiarismNotificationJob.perform_later(id)
    update(notified_at: Time.current)
  end

  def just_closed?
    saved_change_to_status? && %w[closed dismissed resolved].include?(status) && closed_at.nil?
  end

  def record_closure
    update(closed_at: Time.current)
  end
end
