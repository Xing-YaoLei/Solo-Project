class AmountAuditLog < ApplicationRecord
  belongs_to :settlement
  belongs_to :operator, class_name: 'User'

  validates :old_amount, :new_amount, numericality: true
  validates :change_reason, presence: true

  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
  scope :by_operator, ->(operator_id) { where(operator_id: operator_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date..end_date) }
  scope :amount_increased, -> { where('new_amount > old_amount') }
  scope :amount_decreased, -> { where('new_amount < old_amount') }
end
