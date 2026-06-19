class ReportsController < ApplicationController
  def verification_efficiency
    @period = params[:period] || "7d"

    start_date = case @period
                 when "7d" then 7.days.ago
                 when "30d" then 30.days.ago
                 when "90d" then 90.days.ago
                 else 7.days.ago
                 end

    performances = Performance.where(start_time: start_date..)
    tickets_in_range = Ticket.where(created_at: start_date..)

    @summary = {
      total_tickets: tickets_in_range.count,
      checked_in: tickets_in_range.where(status: :checked_in).count,
      issued: tickets_in_range.where(status: :issued).count,
      cancelled: tickets_in_range.where(status: :cancelled).count,
      expired: tickets_in_range.where(status: :expired).count,
      checkin_rate: 0,
      exception_count: ExceptionRecord.where(created_at: start_date..).count,
      resolved_exception_count: ExceptionRecord.where(created_at: start_date.., status: :closed).count
    }

    if @summary[:total_tickets].positive?
      @summary[:checkin_rate] = (@summary[:checked_in].to_f / @summary[:total_tickets] * 100).round(2)
    end

    @daily_stats = tickets_in_range.group("DATE(created_at)").group(:status).count.transform_keys { |k| [k[0].to_s, k[1]] }

    @scope_description = "取数口径：票券表(created_at: #{start_date.to_date}~#{Date.current})，按状态分组统计核销效率；异常单表同期内按关闭状态分组"
  end

  def export_verification
    start_date = case params[:period]
                 when "30d" then 30.days.ago
                 when "90d" then 90.days.ago
                 else 7.days.ago
                 end

    tickets = Ticket.where(created_at: start_date..).includes(:order, :ticket_type, :seat)
    exceptions = ExceptionRecord.where(created_at: start_date..)

    filename = "verification_efficiency_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"
    temp_path = Rails.root.join("tmp", "exports", filename)
    FileUtils.mkdir_p(temp_path.dirname)

    Axlsx::Package.new do |p|
      scope_sheet = p.workbook.add_worksheet(name: "取数口径")
      scope_sheet.add_row ["取数口径说明"]
      scope_sheet.add_row ["统计周期", "#{start_date.to_date} ~ #{Date.current}"]
      scope_sheet.add_row ["数据来源", "票券表 + 异常单表"]
      scope_sheet.add_row ["口径描述", "票券按状态分组统计核销效率；异常单同期内按关闭状态分组"]
      scope_sheet.add_row ["导出时间", Time.current.to_s]
      scope_sheet.add_row ["票券总数", tickets.count.to_s]
      scope_sheet.add_row ["已签到", tickets.where(status: :checked_in).count.to_s]
      scope_sheet.add_row ["核销率", tickets.count.positive? ? "#{(tickets.where(status: :checked_in).count.to_f / tickets.count * 100).round(2)}%" : "0%"]

      ticket_sheet = p.workbook.add_worksheet(name: "票券明细")
      ticket_sheet.add_row %w[票号 状态 订单号 票种 座位 签到时间 创建时间]
      tickets.each do |t|
        ticket_sheet.add_row [t.ticket_no, t.status, t.order.order_no, t.ticket_type.name, t.seat&.display_name, t.checked_in_at&.to_s, t.created_at.to_s]
      end

      exception_sheet = p.workbook.add_worksheet(name: "异常单明细")
      exception_sheet.add_row %w[异常类型 标题 状态 影响范围 责任人 关闭结论 创建时间]
      exceptions.each do |e|
        exception_sheet.add_row [e.exception_type, e.title, e.status, e.impact_scope, e.responsible_person, e.conclusion, e.created_at.to_s]
      end
    end.serialize(temp_path.to_s)

    send_file temp_path.to_s, filename: filename, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end
end
