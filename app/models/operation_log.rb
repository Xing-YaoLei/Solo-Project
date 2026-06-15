class OperationLog < ApplicationRecord
  STATUSES = %w[completed pending failed cancelled].freeze
  ACTIONS = %w[create update delete approve reject submit review export import login logout assign unassign notify].freeze

  belongs_to :operator, class_name: "User", optional: true
  belongs_to :target, polymorphic: true, optional: true

  validates :action, presence: true, inclusion: { in: ACTIONS }
  validates :status, inclusion: { in: STATUSES }

  scope :by_operator, ->(operator_id) { where(operator_id: operator_id) if operator_id.present? }
  scope :by_action, ->(action) { where(action: action) if action.present? }
  scope :by_target, ->(target_type, target_id) { where(target_type: target_type, target_id: target_id) if target_type.present? && target_id.present? }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) if start_date && end_date }
  scope :recent, -> { order(created_at: :desc) }

  def self.log!(action, operator: nil, target: nil, reason: nil, details: nil, before_data: {}, after_data: {}, ip: nil, user_agent: nil, status: "completed")
    create!(
      action: action,
      operator: operator,
      target: target,
      reason: reason,
      details: details,
      before_data: before_data,
      after_data: after_data,
      ip_address: ip,
      user_agent: user_agent,
      status: status,
      closed_at: %w[completed cancelled failed].include?(status) ? Time.current : nil
    )
  end

  def close!
    update(status: "completed", closed_at: Time.current) unless %w[completed cancelled failed].include?(status)
  end

  def target_name
    return "N/A" unless target
    target.try(:name) || target.try(:title) || "#{target_type}##{target_id}"
  end
end
