class Settlement < ApplicationRecord
  belongs_to :patient
  belongs_to :assessment_record

  has_many :denial_actions
  has_many :notifications

  enum :status, { pending: 'pending', submitted: 'submitted', approved: 'approved', denied: 'denied', closed: 'closed' }

  scope :by_status, ->(s) { where(status: s) }
end
