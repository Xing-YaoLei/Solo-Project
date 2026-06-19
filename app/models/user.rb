class User < ApplicationRecord
  ROLES = %w[admin manager technician receptionist].freeze

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, ROLES.zip(ROLES).to_h

  has_many :created_work_orders, class_name: 'WorkOrder', foreign_key: 'created_by_id'
  has_many :assigned_work_orders, class_name: 'WorkOrder', foreign_key: 'assigned_to_id'
  has_many :work_order_items, foreign_key: 'technician_id'
  has_many :stock_alerts_as_handler, class_name: 'StockAlert', foreign_key: 'handler_id'
  has_many :stock_alerts_as_reassigned, class_name: 'StockAlert', foreign_key: 'reassigned_to_id'
  has_many :notes, foreign_key: 'author_id'
  has_many :timeline_events, foreign_key: 'user_id'
  has_many :approved_quotes, class_name: 'Quote', foreign_key: 'approved_by_id'
  has_many :created_quotes, class_name: 'Quote', foreign_key: 'created_by_id'

  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }
end
