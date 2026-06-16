class DenialNotifier
  def notify_responsible_persons(settlement)
    area = settlement.patient.area
    finance_users = User.where(area: area, role: :finance)

    finance_users.each do |user|
      notification = Notification.create!(
        user: user,
        settlement: settlement,
        title: "医保结算被驳回",
        message: "患者 #{settlement.patient.name} 的医保结算（金额：#{settlement.amount}）已被驳回，请及时处理。",
        category: "denial",
        sent_at: Time.current
      )

      DenialNotificationWorker.perform_async(notification.id)
    end
  end
end
