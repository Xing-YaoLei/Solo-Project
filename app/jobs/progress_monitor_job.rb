class ProgressMonitorJob < ApplicationJob
  queue_as :default

  def perform
    CourseConsumption.where.not(status: [:closed, :rejected]).find_each do |cc|
      next unless cc.behind_schedule?

      cc.reminder_rules.enabled.where(rule_type: "progress_delay").find_each do |rule|
        next if rule.last_triggered_at && rule.last_triggered_at > 24.hours.ago

        trigger_reminder(cc, rule)
      end
    end
  end

  private

  def trigger_reminder(course_consumption, rule)
    message = "课程消耗单 #{course_consumption.bill_no} 进度落后，当前完成率 #{course_consumption.progress_rate}%。请及时处理。"

    course_consumption.settlement_events.create!(
      event_type: "note_added",
      notes: message
    )

    rule.update!(last_triggered_at: Time.current)
  end
end
