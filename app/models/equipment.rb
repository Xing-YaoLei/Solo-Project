class Equipment < ApplicationRecord
  belongs_to :area

  has_many :training_sessions
  has_many :equipment_maintenances

  enum :status, { normal: 'normal', maintenance: 'maintenance', retired: 'retired' }

  scope :by_status, ->(s) { where(status: s) }
  scope :by_area, ->(a) { where(area_id: a) }
end
