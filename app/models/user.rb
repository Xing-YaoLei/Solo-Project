class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :ticket_orders, dependent: :nullify
  has_many :check_in_records, foreign_key: :operator_id, dependent: :nullify
  has_many :handled_disputes, class_name: "RefundDispute", foreign_key: :handler_id, dependent: :nullify
  has_many :dispute_logs, foreign_key: :operator_id, dependent: :nullify

  validates :role, presence: true, inclusion: { in: %w[admin manager staff] }

  scope :admins, -> { where(role: "admin") }
  scope :managers, -> { where(role: "manager") }

  def admin?
    role == "admin"
  end

  def manager?
    role == "manager"
  end

  def staff?
    role == "staff"
  end

  def can_check_in?
    admin? || manager? || staff?
  end

  def can_handle_dispute?
    admin? || manager?
  end
end
