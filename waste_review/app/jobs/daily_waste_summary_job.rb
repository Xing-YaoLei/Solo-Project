class DailyWasteSummaryJob
  include Sidekiq::Job

  sidekiq_options retry: 2, dead: true, queue: 'default'

  def perform
    today = Date.current
    Rails.logger.info "Starting daily waste summary for #{today}"

    total_reports = 0
    total_cost = 0
    abnormal_created = 0

    Store.active.find_each do |store|
      daily_reports = store.waste_reports.where(report_date: today)
      daily_cost = daily_reports.sum(:total_cost)
      total_reports += daily_reports.count
      total_cost += daily_cost

      Rails.logger.info("Daily summary - #{store.name}: #{daily_reports.count} reports, total cost: ¥#{sprintf('%.2f', daily_cost)}")

      seven_day_ago = today - 7.days
      recent_reports = store.waste_reports.where(report_date: seven_day_ago..today.yesterday)
      daily_groups = recent_reports.group("DATE(report_date)").sum(:total_cost)
      avg_cost = daily_groups.empty? ? 0 : daily_groups.values.sum / daily_groups.size

      if avg_cost.positive? && daily_cost > avg_cost * 2
        latest_report = daily_reports.order(total_cost: :desc).first
        if latest_report && !latest_report.abnormal_report.present?
          abnormal = AbnormalReport.create!(
            waste_report: latest_report,
            severity: :high,
            impact_scope: "近7天日均损耗: ¥#{sprintf('%.2f', avg_cost)}，今日损耗: ¥#{sprintf('%.2f', daily_cost)}，超出2倍预警",
            responsibility_attribution: "#{store.name} - #{store.region || '未分配区域'}",
            handling_result: ""
          )
          abnormal_created += 1
          Rails.logger.warn("Created abnormal report ##{abnormal.id} for #{store.name} due to unusually high waste")
        end
      end

      daily_reports.each do |report|
        SidekiqSafe.perform_async(AnomalyDetectionJob, report.id)
      end
    end

    Rails.logger.info "Daily summary complete. Total reports: #{total_reports}, Total cost: ¥#{sprintf('%.2f', total_cost)}, Abnormals created: #{abnormal_created}"
  rescue StandardError => e
    Rails.logger.error "Daily waste summary failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end
end
