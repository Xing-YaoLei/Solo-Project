class AssessmentRecord < ApplicationRecord
  belongs_to :patient
  belongs_to :scale, class_name: 'AssessmentScale'
  belongs_to :assessor, class_name: 'User'

  has_many :training_prescriptions
  has_many :nursing_logs

  enum :status, { draft: 'draft', completed: 'completed', cancelled: 'cancelled' }

  scope :by_status, ->(s) { where(status: s) }
  scope :by_date_range, ->(start, end_d) { where(assessed_at: start..end_d) }
end
