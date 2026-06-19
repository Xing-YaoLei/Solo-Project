class HeatPoint < ApplicationRecord
  enum :status, { active: 0, inactive: 1 }, default: :active

  has_many :processing_records, as: :recordable
  has_many :todos, as: :source

  validates :name, presence: true
  validates :heat_level, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }

  scope :by_zone, ->(zone) { where(zone: zone) if zone.present? }
  scope :by_heat_level, ->(level) { where(heat_level: level) if level.present? }
  scope :high_heat, -> { where("heat_level >= ?", 4) }

  def self.ransackable_attributes(auth_object = nil)
    %w[category created_at description heat_level id latitude longitude name status updated_at zone]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[processing_records todos]
  end
end
