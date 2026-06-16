class User < ApplicationRecord
  belongs_to :area

  has_many :assessment_records, foreign_key: :assessor_id
  has_many :nursing_logs, foreign_key: :nurse_id
  has_many :notifications
  has_many :denial_actions, foreign_key: :operator_id

  enum :role, { admin: 'admin', therapist: 'therapist', finance: 'finance' }

  scope :by_role, ->(role) { where(role: role) }
end
