class RoomStatus < ApplicationRecord
  STATUSES = %w[available occupied reserved blocked maintenance cleaning].freeze

  belongs_to :property

  validates :status_date, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :status_date, uniqueness: { scope: :property_id }

  scope :for_date_range, ->(start_date, end_date) { where(status_date: start_date..end_date) }
  scope :for_property, ->(property_id) { where(property_id: property_id) }

  def status_i18n
    I18n.t("room_statuses.#{status}", default: status)
  end

  def status_color
    case status
    when "available" then "bg-green-100 text-green-800"
    when "occupied" then "bg-red-100 text-red-800"
    when "reserved" then "bg-blue-100 text-blue-800"
    when "blocked" then "bg-gray-100 text-gray-800"
    when "maintenance" then "bg-yellow-100 text-yellow-800"
    when "cleaning" then "bg-purple-100 text-purple-800"
    else "bg-gray-100 text-gray-800"
    end
  end
end
