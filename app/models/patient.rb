class Patient < ApplicationRecord
  belongs_to :area

  has_many :assessment_records
  has_many :nursing_logs
  has_many :settlements

  scope :by_area, ->(area_id) { where(area_id: area_id) }
end
