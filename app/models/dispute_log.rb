class DisputeLog < ApplicationRecord
  belongs_to :refund_dispute
  belongs_to :operator, class_name: "User"

  validates :action_type, presence: true, inclusion: { in: %w[created processing resolved rejected cancelled] }
  validates :reason, presence: true

  scope :by_dispute, ->(dispute_id) { where(refund_dispute_id: dispute_id) }
  scope :chronological, -> { order(created_at: :asc) }

  def action_label
    I18n.t("dispute_log.actions.#{action_type}", default: action_type.humanize)
  end
end
