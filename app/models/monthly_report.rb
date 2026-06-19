class MonthlyReport < ApplicationRecord
  belongs_to :property

  validates :report_month, presence: true
  validates :occupancy_rate, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true

  scope :for_month, ->(month) { where(report_month: month.beginning_of_month) }
  scope :for_property, ->(property_id) { where(property_id: property_id) }

  def month_display
    report_month.strftime("%Y年%m月")
  end

  def occupancy_rate_display
    "#{occupancy_rate.to_f.round(2)}%"
  end

  def self.generate_for_month!(month)
    properties = Property.active
    reports = []

    properties.each do |property|
      rate = property.calculate_occupancy(month)
      total_rooms = property.room_count
      occupied_rooms = (total_rooms * rate / 100).round

      total_revenue = property.channel_orders
                                  .where("check_in >= ? AND check_in <= ?", month.beginning_of_month, month.end_of_month)
                                  .where(status: %w[confirmed checked_in checked_out])
                                  .sum { |o| o.total_price }

      report = find_or_create_by!(report_month: month.beginning_of_month, property: property) do |r|
        r.occupancy_rate = rate
        r.total_rooms = total_rooms
        r.occupied_rooms = occupied_rooms
        r.total_revenue = total_revenue
      end
      report.update!(
        occupancy_rate: rate,
        total_rooms: total_rooms,
        occupied_rooms: occupied_rooms,
        total_revenue: total_revenue
      )
      reports << report
    end
    reports
  end
end
