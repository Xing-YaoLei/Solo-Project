class User < ApplicationRecord
  ROLES = %w[admin operator manager teacher].freeze

  has_many :managed_communities, class_name: "Community", foreign_key: "manager_id"
  has_many :created_benefit_rules, class_name: "BenefitRule", foreign_key: "creator_id"
  has_many :created_assignments, class_name: "Assignment", foreign_key: "creator_id"
  has_many :handled_plagiarism_logs, class_name: "PlagiarismLog", foreign_key: "handler_id"
  has_many :responsible_plagiarism_logs, class_name: "PlagiarismLog", foreign_key: "responsible_user_id"
  has_many :export_records, foreign_key: "operator_id"
  has_many :operation_logs, foreign_key: "operator_id"

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, inclusion: { in: ROLES }

  def admin?
    role == "admin"
  end

  def manager?
    role == "manager" || role == "admin"
  end
end
