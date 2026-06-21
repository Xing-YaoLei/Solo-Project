class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  belongs_to :merchant, optional: true
  has_many :settlements, foreign_key: :handler_id
  has_many :approval_records, foreign_key: :approver_id
  has_many :assigned_todo_items, class_name: 'TodoItem', foreign_key: :assignee_id
  has_many :assigned_by_todo_items, class_name: 'TodoItem', foreign_key: :assigner_id
  has_many :amount_audit_logs, foreign_key: :operator_id
  has_many :delivery_orders, foreign_key: :rider_id
  has_many :supplement_materials, foreign_key: :uploader_id
  has_many :contract_attachments, foreign_key: :uploader_id
  has_many :filter_configs

  enum :role, { merchant: 0, rider: 1, cs: 2, city_manager: 3 }

  validates :name, presence: true
  validates :phone, presence: true, uniqueness: true
  validates :role, presence: true

  scope :by_role, ->(role) { where(role: role) }
  scope :by_city, ->(city_id) { where(city_id: city_id) }
  scope :active, -> { where.not(encrypted_password: '') }
end
