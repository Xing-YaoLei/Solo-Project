class Discrepancy < ApplicationRecord
  belongs_to :settlement
  belongs_to :resolved_by_user, class_name: 'User', foreign_key: 'resolved_by', optional: true
  has_many :supplement_materials, dependent: :destroy
  has_many :todo_items, dependent: :destroy

  enum :status, { pending: 0, resolved: 1, rejected: 2, investigating: 3 }

  validates :difference_amount, numericality: true

  scope :by_status, ->(status) { where(status: status) }
  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :unresolved, -> { where(status: [:pending, :investigating]) }
  scope :by_resolved_by, ->(user_id) { where(resolved_by: user_id) }
end
