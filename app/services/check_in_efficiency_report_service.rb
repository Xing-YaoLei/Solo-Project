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
    orders = scoped_orders
    checked_in_orders = orders.checked_in

    {
      total_orders: orders.count,
      checked_in: checked_in_orders.count,
      rate: calculate_rate(orders.count, checked_in_orders.count),
      by_ticket_type: calculate_by_ticket_type(orders),
      by_method: calculate_by_method(checked_in_orders),
      daily_summary: calculate_daily_summary(orders),
      daily_trend: calculate_daily_trend(checked_in_orders)
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

  def calculate_rate(total, checked)
    return 0 if total.zero?
    checked.to_f / total * 100
  end

  def calculate_by_ticket_type(orders)
    event.ticket_types.map do |tt|
      tt_orders = orders.where(ticket_type: tt)
      total = tt_orders.count
      checked = tt_orders.checked_in.count
      {
        name: tt.name,
        total: total,
        checked_in: checked,
        rate: calculate_rate(total, checked)
      }
    end
  end

  def calculate_by_method(checked_in_orders)
    record_ids = checked_in_orders.joins(:check_in_record).select("check_in_records.id")
    CheckInRecord.where(id: record_ids)
                 .group(:check_in_method)
                 .count
  end

  def calculate_daily_summary(orders)
    date_range = start_date.to_date..end_date.to_date
    date_range.each_with_object({}) do |date, hash|
      day_start = date.beginning_of_day
      day_end = date.end_of_day
      day_orders = orders.where(created_at: day_start..day_end)
      total = day_orders.count
      checked = day_orders.checked_in.count
      hash[date] = {
        total_orders: total,
        checked_in: checked,
        rate: calculate_rate(total, checked)
      }
    end
  end

  def calculate_daily_trend(checked_in_orders)
    record_ids = checked_in_orders.joins(:check_in_record).select("check_in_records.id")
    CheckInRecord.where(id: record_ids)
                 .group_by_day(:check_in_time, range: start_datetime..end_datetime)
                 .count
  end
end
