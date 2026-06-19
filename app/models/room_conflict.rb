class RoomConflict < ApplicationRecord
  STATUSES = %w[open acknowledged resolved closed].freeze

  belongs_to :property
  belongs_to :handler, class_name: "User", optional: true
  has_many :conflict_actions, dependent: :destroy

  validates :conflict_date, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :reason, presence: true

  scope :open, -> { where(status: %w[open acknowledged]) }
  scope :resolved, -> { where(status: %w[resolved closed]) }
  scope :for_date, ->(date) { where(conflict_date: date) }
  scope :for_property, ->(property_id) { where(property_id: property_id) }
  scope :for_handler, ->(user_id) { where(handler_id: user_id) }
  scope :visible_to, ->(user) {
    return all if user.nil?
    return all if user.role == "admin"
    where(handler_id: user.id).or(where(handler_id: nil))
  }

  after_create :notify_handler

  def status_i18n
    I18n.t("conflict_statuses.#{status}", default: status)
  end

  def status_color
    case status
    when "open" then "bg-red-100 text-red-800"
    when "acknowledged" then "bg-yellow-100 text-yellow-800"
    when "resolved" then "bg-blue-100 text-blue-800"
    when "closed" then "bg-gray-100 text-gray-800"
    else "bg-gray-100 text-gray-800"
    end
  end

  def acknowledge!(user)
    update!(status: "acknowledged", handler: user)
    conflict_actions.create!(action: "确认受理冲突", actor: user, note: "由 #{user.name} 受理")
  end

  def resolve!(user, action_note)
    update!(status: "resolved")
    conflict_actions.create!(action: action_note, actor: user, note: "解决冲突")
  end

  def close!(user)
    update!(status: "closed", closed_at: Time.current)
    conflict_actions.create!(action: "关闭冲突", actor: user, note: "处理完成，关闭冲突")
  end

  private

  def notify_handler
    ConflictNotificationJob.perform_later(id)
  end
end
