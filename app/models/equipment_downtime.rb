class EquipmentDowntime < ApplicationRecord
  has_many :downtime_actions, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy

  validates :equipment_name, presence: true
  validates :equipment_type, presence: true, inclusion: { in: %w[barrier_camera payment_terminal access_gate sensor] }
  validates :reason, presence: true
  validates :status, presence: true, inclusion: { in: %w[active resolved] }

  scope :active, -> { where(status: :active) }
  scope :resolved, -> { where(status: :resolved) }
  scope :recent, -> { order(started_at: :desc) }

  after_create :notify_relevant_roles

  def resolve!(resolved_by:, action_taken:, closed_at: Time.current)
    update!(
      status: :resolved,
      resolved_by: resolved_by,
      action_taken: action_taken,
      closed_at: closed_at
    )
  end

  private

  def notify_relevant_roles
    EquipmentDowntimeNotificationJob.perform_later(id)
  end
end
