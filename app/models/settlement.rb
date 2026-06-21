class Settlement < ApplicationRecord
  belongs_to :merchant
  belongs_to :handler, class_name: 'User', optional: true
  has_many :settlement_items, dependent: :destroy
  has_many :discrepancies, dependent: :destroy
  has_many :supplement_materials, through: :discrepancies
  has_many :approval_records, dependent: :destroy
  has_many :todo_items, dependent: :destroy
  has_many :amount_audit_logs, dependent: :destroy

  enum :status, { pending: 0, approved: 1, rejected: 2, processing: 3, completed: 4 }

  validates :period, presence: true, uniqueness: { scope: :merchant_id }
  validates :system_amount, :merchant_amount, :difference_amount, numericality: true

  scope :by_status, ->(status) { where(status: status) }
  scope :by_merchant, ->(merchant_id) { where(merchant_id: merchant_id) }
  scope :by_period, ->(period) { where(period: period) }
  scope :by_payment_date, ->(start_date, end_date) { where(payment_date: start_date..end_date) }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_difference, -> { where('difference_amount != 0') }
end
