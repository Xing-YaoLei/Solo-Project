class EquipmentDowntimeNotificationJob < ApplicationJob
  queue_as :notifications

  def perform(downtime_id)
    downtime = EquipmentDowntime.find_by(id: downtime_id)
    return unless downtime

    roles = relevant_roles_for(downtime.equipment_type)

    roles.each do |role|
      Notification.create!(
        recipient_role: role,
        title: "设备停机通知: #{downtime.equipment_name}",
        message: "#{downtime.equipment_name}(#{downtime.equipment_type}) 已于 #{downtime.started_at.strftime('%Y-%m-%d %H:%M')} 停机。原因: #{downtime.reason}",
        channel: notification_channel_for(role),
        notifiable: downtime
      )
    end
  end

  private

  def relevant_roles_for(equipment_type)
    case equipment_type
    when "barrier_camera"
      %w[security_manager property_manager]
    when "payment_terminal"
      %w[finance_manager property_manager]
    when "access_gate"
      %w[security_manager property_manager maintenance_manager]
    when "sensor"
      %w[maintenance_manager property_manager]
    else
      %w[property_manager]
    end
  end

  def notification_channel_for(role)
    case role
    when "security_manager"
      "sms"
    when "finance_manager"
      "email"
    else
      "in_app"
    end
  end
end
