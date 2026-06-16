class Area < ApplicationRecord
  has_many :users
  has_many :patients
  has_many :equipment
  has_many :treatment_calendar_thresholds
end
