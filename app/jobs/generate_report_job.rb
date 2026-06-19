class GenerateReportJob < ApplicationJob
  queue_as :default

  def perform(report_type, start_date, end_date, user_id)
    user = User.find_by(id: user_id)
    return unless user

    start_date = Date.parse(start_date)
    end_date = Date.parse(end_date)

    report_data = case report_type
                  when 'work_orders'
                    generate_work_orders_report(start_date, end_date)
                  when 'repair_rate'
                    generate_repair_rate_report(start_date, end_date)
                  else
                    {}
                end

    report_path = save_report(report_type, report_data)

    ReportMailer.with(user: user, report_path: report_path, report_type: report_type).report_ready_email.deliver_later if defined?(ReportMailer)
  end

  private

  def generate_work_orders_report(start_date, end_date)
    work_orders = WorkOrder.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
    {
      total_count: work_orders.count,
      by_status: work_orders.group(:status).count,
      by_priority: work_orders.group(:priority).count,
      repair_rate: WorkOrder.repair_rate(start_date.beginning_of_day..end_date.end_of_day)
    }
  end

  def generate_repair_rate_report(start_date, end_date)
    daily_data = {}
    (start_date..end_date).each do |date|
      daily_data[date.to_s] = WorkOrder.repair_rate(date.all_day)
    end
    {
      period_start: start_date.to_s,
      period_end: end_date.to_s,
      overall_rate: WorkOrder.repair_rate(start_date.beginning_of_day..end_date.end_of_day),
      daily_data: daily_data
    }
  end

  def save_report(report_type, report_data)
    dir_path = Rails.root.join('tmp', 'reports')
    FileUtils.mkdir_p(dir_path)
    filename = "#{report_type}_#{Time.current.strftime('%Y%m%d%H%M%S')}.json"
    file_path = dir_path.join(filename)
    File.write(file_path, report_data.to_json)
    file_path.to_s
  end
end
