class ScaleItem < ApplicationRecord
  belongs_to :scale, class_name: 'AssessmentScale'
end
