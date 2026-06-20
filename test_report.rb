event = Event.first
if event
  service = CheckInEfficiencyReportService.new(event, 30.days.ago.to_date, Date.today)
  stats = service.stats
  puts '--- 总统计 ---'
  puts "总订单: #{stats[:total_orders]}, 已核销: #{stats[:checked_in]}, 核销率: #{sprintf('%.1f', stats[:rate])}%"
  puts '--- 每日汇总 ---'
  stats[:daily_summary].each do |date, d|
    puts "#{date}: 总#{d[:total_orders]} / 核#{d[:checked_in]} / 率#{sprintf('%.1f', d[:rate])}%"
  end
  puts '--- 每日核销趋势 ---'
  stats[:daily_trend].each do |date, count|
    puts "#{date.to_date}: #{count}"
  end
else
  puts 'No event found'
end

# 验证 sidekiq 配置
puts "\n--- Sidekiq 配置验证 ---"
puts "Active Job adapter: #{Rails.application.config.active_job.queue_adapter}"
require 'yaml'
config = YAML.load_file(Rails.root.join('config/recurring.yml'))
puts "recurring.yml 环境: #{config.keys.join(', ')}"
config.each do |env, jobs|
  puts "  #{env}: #{jobs.keys.join(', ')}" if jobs
end
