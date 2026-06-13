class DailySummaryJob < ApplicationJob
  queue_as :reports

  def perform(date = Date.yesterday)
    date = date.to_date

    DailySummary.calculate_for(date)

    PickupOrder::SOURCES.each do |source|
      DailySummary.calculate_for(date, source)
    end

    Rails.logger.info "每日汇总计算完成: #{date}"
  end
end
