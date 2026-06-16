class NursingLog < ApplicationRecord
  belongs_to :patient
  belongs_to :nurse, class_name: 'User'
  belongs_to :assessment_record, optional: true
end
