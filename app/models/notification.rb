class Notification < ApplicationRecord
  belongs_to :notifiable, polymorphic: true

  validates :recipient_role, presence: true
  validates :title, presence: true
  validates :message, presence: true
  validates :channel, presence: true, inclusion: { in: %w[in_app email sms] }

  scope :unread, -> { where(read_at: nil) }
  scope :by_role, ->(role) { where(recipient_role: role) if role.present? }
  scope :recent, -> { order(created_at: :desc) }

  def mark_as_read!
    update!(read_at: Time.current)
  end

  def read?
    read_at.present?
  end
end
