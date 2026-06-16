class TrainingPrescription < ApplicationRecord
  belongs_to :assessment_record
  belongs_to :rule, class_name: 'PrescriptionRule'
  belongs_to :therapist, class_name: 'User'

  has_many :training_sessions, foreign_key: 'prescription_id'

  enum :status, { pending: 'pending', active: 'active', completed: 'completed', cancelled: 'cancelled' }
end
