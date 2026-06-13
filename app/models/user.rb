class User < ApplicationRecord
  has_secure_password

  ROLES = %w[operator reviewer admin].freeze

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, inclusion: { in: ROLES }

  has_many :operated_orders, class_name: 'PickupOrder', foreign_key: 'operator_id'
  has_many :reviewed_orders, class_name: 'PickupOrder', foreign_key: 'reviewer_id'
  has_many :uploaded_proofs, class_name: 'AfterSalesProof', foreign_key: 'uploaded_by_id'
  has_many :handled_shortages, class_name: 'ShortageRecord', foreign_key: 'handled_by_id'
  has_many :activity_logs

  def operator?
    role == 'operator'
  end

  def reviewer?
    role == 'reviewer' || role == 'admin'
  end

  def admin?
    role == 'admin'
  end

  def display_name
    "#{name} (#{role})"
  end
end
