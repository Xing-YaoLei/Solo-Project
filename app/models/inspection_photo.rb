class InspectionPhoto < ApplicationRecord
  PHOTO_TYPES = %w[before process after].freeze

  belongs_to :work_order
  belongs_to :taken_by, class_name: 'User', optional: true
  has_one_attached :image

  enum :photo_type, PHOTO_TYPES.zip(PHOTO_TYPES).to_h
end
