class CheckInEfficiencyReportService
  attr_reader :event, :start_date, :end_date, :start_datetime, :end_datetime

  def initialize(event, start_date, end_date)
    @event = event
    @start_date = start_date.is_a?(Date) ? start_date : Date.parse(start_date.to_s)
    @end_date = end_date.is_a?(Date) ? end_date : Date.parse(end_date.to_s)
    @start_datetime = @start_date.beginning_of_day
    @end_datetime = @end_date.end_of_day
  end

  def stats
    orders = scoped_orders.load
    {
      total_orders: orders.count,
      checked_in: orders.count { |o| o.status == "checked_in" },
      rate: calculate_rate(orders),
      by_ticket_type: calculate_by_ticket_type(orders),
      by_method: calculate_by_method(orders),
      daily_trend: calculate_daily_trend(orders)
    }
  end

  def scoped_orders
    event.ticket_orders
         .includes(:ticket_type, :check_in_record)
         .where(status: %w[paid checked_in])
         .where(created_at: start_datetime..end_datetime)
  end

  def check_in_records
    CheckInRecord.joins(:ticket_order)
                 .where(ticket_order_id: scoped_orders.select(:id))
                 .includes(:ticket_order, :ticket_type, :operator)
                 .order(check_in_time: :desc)
  end

  def filter_description
    "活动: #{event.name}, 统计口径: 以订单创建时间为准（#{start_date} ~ #{end_date}，覆盖全天 00:00:00 ~ 23:59:59），统计该时间段内创建订单的核销转化情况"
  end

  private

  def calculate_rate(orders)
    total = orders.count
    return 0 if total.zero?
    orders.count { |o| o.status == "checked_in" }.to_f / total * 100
  end

  def calculate_by_ticket_type(orders)
    event.ticket_types.map do |tt|
      tt_orders = orders.select { |o| o.ticket_type_id == tt.id }
      total = tt_orders.count
      checked = tt_orders.count { |o| o.status == "checked_in" }
      {
        name: tt.name,
        total: total,
        checked_in: checked,
        rate: total.zero? ? 0 : (checked.to_f / total * 100).round(2)
      }
    end
  end

  def calculate_by_method(orders)
    records = orders.select { |o| o.status == "checked_in" }.map(&:check_in_record).compact
    records.group_by { |r| r.check_in_method }.transform_values(&:count)
  end

  def calculate_daily_trend(orders)
    records = orders.select { |o| o.status == "checked_in" }.map(&:check_in_record).compact
    return {} if records.empty?

    start_datetime.upto(end_datetime).each_with_object({}) do |date, hash|
      hash[date.to_date] = records.count { |r| r.check_in_time.to_date == date.to_date }
    end
  end
end
