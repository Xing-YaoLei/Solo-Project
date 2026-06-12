module WasteReportCsvExport
  extend ActiveSupport::Concern

  STATUS_MAP = {
    "submitted" => "已提交",
    "reviewing" => "复核中",
    "approved" => "已审批",
    "rejected" => "已驳回",
    "settled" => "已结算"
  }.freeze

  RESULT_MAP = {
    "pending" => "待处理",
    "approved" => "通过",
    "rejected" => "驳回"
  }.freeze

  COST_TYPE_MAP = {
    "material" => "物料成本",
    "labor" => "人工成本",
    "disposal" => "处置成本"
  }.freeze

  def generate_csv(waste_reports, options = {})
    require "csv"

    start_date = options[:start_date]
    end_date = options[:end_date]
    export_time = Time.current.strftime("%Y-%m-%d %H:%M:%S")
    report_count = waste_reports.count
    total_cost = waste_reports.sum(:total_cost)
    avg_waste_rate = report_count.positive? ? (waste_reports.sum(:waste_rate) / report_count).round(2) : 0

    bom = "\xEF\xBB\xBF".force_encoding('UTF-8')
    csv_content = CSV.generate(encoding: "UTF-8") do |csv|
      csv << ["连锁咖啡报损复核结算台 - 数据导出报告"]
      csv << ["导出时间", export_time]
      csv << ["导出范围", build_export_range_description(waste_reports, start_date, end_date)]
      csv << ["导出记录数", report_count]
      csv << []

      csv << ["===== 取数口径说明 ====="]
      csv << ["1. 损耗率计算公式", "损耗率 = 报损总成本 / 门店月度采购总额 × 100%"]
      csv << ["2. 统计周期说明", "按报损日期所在自然月统计，月度采购总额取自门店配置的monthly_purchase字段"]
      csv << ["3. 异常判定标准", "损耗率 > 5% 触发异常单；5%-10%为低级别，10%-20%为中级别，> 20%为高级别"]
      csv << ["4. 成本口径说明", "总成本 = Σ(报损明细数量 × 单价)，不含税；成本条目为追加的责任分摊金额"]
      csv << ["5. 状态流转说明", "已提交 → 复核中 → 已审批/已驳回 → 已结算；已驳回可重新提交"]
      csv << ["6. 数据完整性", "本导出包含所有符合筛选条件的报损单及其明细、复核意见、成本条目"]
      csv << ["7. 异常单关联", "损耗率超标的报损单会自动关联异常单，可在异常单模块查看处理进度"]
      csv << []

      csv << ["===== 本次导出汇总 ====="]
      csv << ["报损总成本", "¥#{sprintf('%.2f', total_cost)}"]
      csv << ["平均损耗率", "#{avg_waste_rate}%"]
      csv << ["异常单数量", waste_reports.joins(:abnormal_report).count]
      csv << []

      csv << ["===== 明细数据 ====="]
      csv << [
        "报损单号", "门店", "区域", "报损日期", "报损人", "状态", "损耗率(%)", "总成本",
        "损耗原因", "产品类别", "产品名称", "SKU", "数量", "单位", "单价", "小计",
        "成本类型", "责任门店", "成本金额",
        "复核人", "复核意见", "复核结果", "复核时间",
        "是否关联异常单", "异常级别"
      ]

      waste_reports.each do |report|
        items = report.waste_items.presence || [nil]
        entries = report.cost_entries.presence || [nil]
        opinions = report.review_opinions.presence || [nil]

        max_rows = [items.size, entries.size, opinions.size].max
        has_abnormal = report.abnormal_report.present?

        max_rows.times do |i|
          item = items[i]
          entry = entries[i]
          opinion = opinions[i]

          csv << [
            i == 0 ? report.id : nil,
            i == 0 ? report.store_name : nil,
            i == 0 ? report.store_region : nil,
            i == 0 ? report.report_date : nil,
            i == 0 ? report.reporter : nil,
            i == 0 ? STATUS_MAP[report.status] : nil,
            i == 0 ? report.waste_rate : nil,
            i == 0 ? report.total_cost : nil,
            item&.waste_reason,
            item&.category,
            item&.product_name,
            item&.product_sku,
            item&.quantity,
            item&.unit,
            item&.unit_cost,
            item&.subtotal,
            entry ? COST_TYPE_MAP[entry.cost_type] || entry.cost_type : nil,
            entry&.responsible_store&.name,
            entry&.amount,
            opinion&.reviewer,
            opinion&.opinion,
            opinion ? RESULT_MAP[opinion.result] || opinion.result : nil,
            opinion&.created_at&.strftime("%Y-%m-%d %H:%M:%S"),
            i == 0 ? (has_abnormal ? "是" : "否") : nil,
            i == 0 && has_abnormal ? severity_text(report.abnormal_report.severity) : nil
          ]
        end
      end

      csv << []
      csv << ["===== 损耗原因分析 ====="]
      csv << ["损耗原因", "金额占比", "总金额"]
      reason_summary = waste_reports.flat_map { |r| r.waste_items }.group_by(&:waste_reason).map do |reason, items|
        total = items.sum(&:subtotal)
        percentage = total_cost.positive? ? ((total / total_cost) * 100).round(2) : 0
        [reason, "#{percentage}%", "¥#{sprintf('%.2f', total)}"]
      end.sort_by { |r| -r[2].gsub(/[^\d.]/, '').to_f }
      reason_summary.each { |row| csv << row }

      csv << []
      csv << ["===== 门店损耗率排名 ====="]
      csv << ["门店", "报损总成本", "月度采购额", "损耗率(%)", "是否异常"]
      store_summary = waste_reports.group_by(&:store_id).map do |store_id, reports|
        store = Store.find_by(id: store_id)
        next unless store

        cost = reports.sum(&:total_cost)
        purchase = store.monthly_purchase || 100_000.0
        rate = purchase.positive? ? ((cost / purchase) * 100).round(2) : 0
        is_abnormal = rate > 5 ? "是" : "否"
        [store.name, "¥#{sprintf('%.2f', cost)}", "¥#{sprintf('%.2f', purchase)}", rate, is_abnormal]
      end.compact.sort_by { |r| -r[3] }
      store_summary.each { |row| csv << row }
    end
  end

  def generate_abnormal_csv(abnormal_reports)
    require "csv"

    export_time = Time.current.strftime("%Y-%m-%d %H:%M:%S")
    bom = "\xEF\xBB\xBF".force_encoding('UTF-8')

    csv_content = CSV.generate(encoding: "UTF-8") do |csv|
      csv << ["连锁咖啡报损复核结算台 - 异常单导出报告"]
      csv << ["导出时间", export_time]
      csv << ["导出记录数", abnormal_reports.count]
      csv << []

      csv << ["===== 取数口径说明 ====="]
      csv << ["1. 异常判定标准", "损耗率 > 5% 触发异常单；5%-10%为低级别，10%-20%为中级别，> 20%为高级别"]
      csv << ["2. 损耗率计算公式", "损耗率 = 报损总成本 / 门店月度采购总额 × 100%"]
      csv << ["3. 影响范围说明", "自动生成的影响范围包含涉及产品名称、损耗原因和总成本"]
      csv << ["4. 责任归属说明", "自动关联报损单所属门店及区域，可人工调整"]
      csv << ["5. 解决率计算", "解决率 = 已解决异常单数 / 异常单总数 × 100%"]
      csv << []

      csv << ["===== 汇总统计 ====="]
      csv << ["异常单总数", abnormal_reports.count]
      csv << ["已解决", abnormal_reports.resolved.count]
      csv << ["未解决", abnormal_reports.unresolved.count]
      csv << ["解决率", "#{AbnormalReport.resolution_rate}%"]
      csv << ["平均解决时间(天)", AbnormalReport.avg_resolution_time]
      csv << []

      csv << ["===== 明细数据 ====="]
      csv << [
        "异常单号", "关联报损单号", "门店", "严重程度", "状态",
        "损耗率(%)", "报损总成本", "影响范围", "责任归属", "处理结果",
        "创建时间", "解决时间", "处理时长(天)"
      ]

      abnormal_reports.each do |ar|
        csv << [
          ar.id,
          ar.waste_report_id,
          ar.store_name,
          severity_text(ar.severity),
          ar.resolved? ? "已解决" : "未解决",
          ar.waste_rate,
          ar.total_cost,
          ar.impact_scope,
          ar.responsibility_attribution,
          ar.handling_result,
          ar.created_at&.strftime("%Y-%m-%d %H:%M:%S"),
          ar.resolved_at&.strftime("%Y-%m-%d %H:%M:%S"),
          ar.resolved? ? ar.days_open : ar.days_pending
        ]
      end
    end

    bom + csv_content
  end

  private

  def build_export_range_description(waste_reports, start_date, end_date)
    if start_date && end_date
      "日期范围: #{start_date} 至 #{end_date}"
    elsif start_date
      "日期范围: #{start_date} 之后"
    elsif end_date
      "日期范围: #{end_date} 之前"
    else
      "全部报损单（最近50条）"
    end
  end

  def severity_text(severity)
    {
      "low" => "低",
      "medium" => "中",
      "high" => "高"
    }[severity] || severity
  end
end
