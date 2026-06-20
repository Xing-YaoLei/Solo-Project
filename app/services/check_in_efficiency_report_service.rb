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
    orders_in_range = scoped_orders
    records_in_range = scoped_records

    {
      total_orders: orders_in_range.count,
      checked_in: records_in_range.distinct.count(:ticket_order_id),
      rate: calculate_rate(orders_in_range, records_in_range),
      by_method: records_in_range.group(:check_in_method).count,
      by_ticket_type: calculate_by_ticket_type(orders_in_range, records_in_range),
      daily_trend: calculate_daily_trend(records_in_range)
    }
  end

  def scoped_orders
    event.ticket_orders
         .where(status: %w[paid checked_in])
         .where(created_at: start_datetime..end_datetime)
  end

  def scoped_records
    event.check_in_records
         .includes(:ticket_order, :ticket_type, :operator)
         .where(check_in_time: start_datetime..end_datetime)
  end

  def filter_description
    "活动: #{event.name}, 时间范围: #{start_date} ~ #{end_date}（覆盖全天 #{start_datetime.strftime('%H:%M:%S')} ~ #{end_datetime.strftime('%H:%M:%S')}）"
  end

  private

  def calculate_rate(orders, records)
    total = orders.count
    return 0 if total.zero?
    records.distinct.count(:ticket_order_id).to_f / total * 100
  end

  def calculate_by_ticket_type(orders, records)
    event.ticket_types.map do |tt|
      tt_orders = orders.where(ticket_type: tt)
      tt_records = records.where(ticket_type: tt)
      total = tt_orders.count
      checked = tt_records.distinct.count(:ticket_order_id)
      {
        name: tt.name,
        total: total,
        checked_in: checked,
        rate: total.zero? ? 0 : (checked.to_f / total * 100).round(2)
      }
    end
  end

  def calculate_daily_trend(records)
    records.group_by_day(:check_in_time, range: start_datetime..end_datetime).count
  end
end
