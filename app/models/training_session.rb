class TrainingSession < ApplicationRecord
  belongs_to :prescription, class_name: 'TrainingPrescription'
  belongs_to :equipment

  enum :status, { planned: 'planned', in_progress: 'in_progress', completed: 'completed', missed: 'missed' }
end
