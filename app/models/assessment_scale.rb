class AssessmentScale < ApplicationRecord
  has_many :scale_items, dependent: :destroy, foreign_key: :scale_id
  has_many :assessment_records, foreign_key: :scale_id

  accepts_nested_attributes_for :scale_items, allow_destroy: true

  scope :active, -> { where(active: true) }
end
