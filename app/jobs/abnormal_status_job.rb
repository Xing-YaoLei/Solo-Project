class AbnormalStatusJob < ApplicationJob
  queue_as :default

  def perform
    CourseConsumption.where(processing_status: [:needs_more_info, :escalated]).find_each do |cc|
      cc.reminder_rules.enabled.where(rule_type: "abnormal_status").find_each do |rule|
        next if rule.last_triggered_at && rule.last_triggered_at > 12.hours.ago

        trigger_abnormal_reminder(cc, rule)
      end
    end
  end

  private

  def trigger_abnormal_reminder(course_consumption, rule)
    message = "课程消耗单 #{course_consumption.bill_no} 处于异常状态：#{course_consumption.processing_status_label}，请及时跟进。"

    course_consumption.settlement_events.create!(
      event_type: "note_added",
      notes: message
    )

    rule.update!(last_triggered_at: Time.current)
  end
end
