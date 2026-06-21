class ApprovalRecord < ApplicationRecord
  belongs_to :settlement
  belongs_to :approval_node
  belongs_to :approver, class_name: 'User'

  enum :decision, { pending: 0, approved: 1, rejected: 2, skipped: 3 }

  validates :decision, presence: true

  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
  scope :by_approver, ->(approver_id) { where(approver_id: approver_id) }
  scope :by_decision, ->(decision) { where(decision: decision) }
  scope :by_node, ->(approval_node_id) { where(approval_node_id: approval_node_id) }
  scope :recent, -> { order(created_at: :desc) }
end
