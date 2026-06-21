module Reports
  class PaymentCycleService
    def initialize(params = {})
      @start_date = params[:start_date]&.to_date || 3.months.ago.to_date
      @end_date = params[:end_date]&.to_date || Date.current
      @merchant_id = params[:merchant_id]
      @status = params[:status]
    end

    def generate
      settlements = filtered_settlements

      {
        summary: generate_summary(settlements),
        cycles: generate_cycles(settlements),
        merchants: generate_merchant_breakdown(settlements),
        export_data: generate_export_data(settlements)
      }
    end

    def export(format = :xlsx)
      data = generate
      filename = "payment_cycle_report_#{Time.current.strftime("%Y%m%d%H%M%S")}"

      case format
      when :csv
        generate_csv(data[:export_data], filename)
      when :xlsx
        generate_xlsx(data, filename)
      else
        raise ArgumentError, "Unsupported format: #{format}"
      end
    end

    private

    def filtered_settlements
      scope = Settlement.by_payment_date(@start_date, @end_date)
      scope = scope.by_merchant(@merchant_id) if @merchant_id
      scope = scope.by_status(@status) if @status
      scope.includes(:merchant, :approval_records).order(payment_date: :desc)
    end

    def generate_summary(settlements)
      {
        total_count: settlements.count,
        total_amount: settlements.sum(:system_amount),
        total_merchant_amount: settlements.sum(:merchant_amount),
        total_difference: settlements.sum(:difference_amount),
        avg_payment_delay: calculate_avg_payment_delay(settlements),
        status_breakdown: settlements.group(:status).count,
        total_with_discrepancy: settlements.with_difference.count
      }
    end

    def generate_cycles(settlements)
      settlements.group_by_month(:payment_date, format: "%Y-%m").map do |month, items|
        {
          month:,
          count: items.count,
          total_amount: items.sum(:system_amount),
          total_difference: items.sum(:difference_amount),
          avg_amount: items.sum(:system_amount) / [items.count, 1].max.to_f,
          discrepancy_count: items.with_difference.count,
          approval_rate: calculate_approval_rate(items)
        }
      end
    end

    def generate_merchant_breakdown(settlements)
      settlements.group_by(&:merchant_id).map do |merchant_id, items|
        merchant = items.first.merchant
        next unless merchant

        {
          merchant_id:,
          merchant_name: merchant.name,
          settlement_count: items.count,
          total_amount: items.sum(:system_amount),
          total_difference: items.sum(:difference_amount),
          avg_settlement_amount: items.sum(:system_amount) / [items.count, 1].max.to_f,
          discrepancy_rate: (items.with_difference.count.to_f / items.count * 100).round(2),
          last_settlement_date: items.max_by(&:payment_date)&.payment_date
        }
      end.compact
    end

    def generate_export_data(settlements)
      settlements.map do |s|
        {
          "结算单ID" => s.id,
          "商家名称" => s.merchant&.name,
          "账期" => s.period,
          "系统金额" => s.system_amount,
          "商家金额" => s.merchant_amount,
          "差异金额" => s.difference_amount,
          "状态" => I18n.t("enums.settlement.status.#{s.status}"),
          "付款日期" => s.payment_date,
          "创建时间" => s.created_at,
          "处理人" => s.handler&.name
        }
      end
    end

    def calculate_avg_payment_delay(settlements)
      delayed = settlements.where("payment_date < ?", Date.current).where.not(status: :completed)
      return 0 if delayed.empty?

      delayed.sum { |s| (Date.current - s.payment_date).to_i } / delayed.count
    end

    def calculate_approval_rate(items)
      return 0 if items.empty?

      approved = items.where(status: :approved).count
      (approved.to_f / items.count * 100).round(2)
    end

    def generate_csv(data, filename)
      require "csv"

      filepath = Rails.root.join("tmp", "#{filename}.csv")
      CSV.open(filepath, "wb") do |csv|
        csv << data.first.keys if data.any?
        data.each { |row| csv << row.values }
      end

      filepath
    end

    def generate_xlsx(data, filename)
      require "rubyXL"

      workbook = RubyXL::Workbook.new
      worksheet = workbook[0]
      worksheet.sheet_name = "结算汇总"

      headers = ["月份", "结算数量", "总金额", "差异金额", "平均金额", "差异数量", "通过率(%)"]
      headers.each_with_index { |h, i| worksheet.add_cell(0, i, h) }

      data[:cycles].each_with_index do |cycle, idx|
        row = idx + 1
        worksheet.add_cell(row, 0, cycle[:month])
        worksheet.add_cell(row, 1, cycle[:count])
        worksheet.add_cell(row, 2, cycle[:total_amount])
        worksheet.add_cell(row, 3, cycle[:total_difference])
        worksheet.add_cell(row, 4, cycle[:avg_amount])
        worksheet.add_cell(row, 5, cycle[:discrepancy_count])
        worksheet.add_cell(row, 6, cycle[:approval_rate])
      end

      merchant_sheet = workbook.add_worksheet("商家明细")
      merchant_headers = ["商家ID", "商家名称", "结算数量", "总金额", "差异金额", "平均金额", "差异率(%)", "最后结算日"]
      merchant_headers.each_with_index { |h, i| merchant_sheet.add_cell(0, i, h) }

      data[:merchants].each_with_index do |m, idx|
        row = idx + 1
        merchant_sheet.add_cell(row, 0, m[:merchant_id])
        merchant_sheet.add_cell(row, 1, m[:merchant_name])
        merchant_sheet.add_cell(row, 2, m[:settlement_count])
        merchant_sheet.add_cell(row, 3, m[:total_amount])
        merchant_sheet.add_cell(row, 4, m[:total_difference])
        merchant_sheet.add_cell(row, 5, m[:avg_settlement_amount])
        merchant_sheet.add_cell(row, 6, m[:discrepancy_rate])
        merchant_sheet.add_cell(row, 7, m[:last_settlement_date]&.to_s)
      end

      filepath = Rails.root.join("tmp", "#{filename}.xlsx")
      workbook.write(filepath)

      filepath
    end
  end
end
