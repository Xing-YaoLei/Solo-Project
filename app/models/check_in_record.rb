class CheckInRecord < ApplicationRecord
  belongs_to :order
  belongs_to :staff, class_name: "User", optional: true

  validates :order, presence: true

  scope :checked_in, -> { where.not(actual_check_in_at: nil) }
  scope :checked_out, -> { where.not(actual_check_out_at: nil) }
  scope :for_date, ->(date) { where("DATE(actual_check_in_at) = ?", date) }
end
