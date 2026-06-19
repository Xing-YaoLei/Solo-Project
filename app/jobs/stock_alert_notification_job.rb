class StockAlertNotificationJob < ApplicationJob
  queue_as :default

  def perform(stock_alert_id)
    stock_alert = StockAlert.find_by(id: stock_alert_id)
    return unless stock_alert

    admin_users = User.where(role: %w[admin manager])
    admin_users.each do |user|
      StockAlertMailer.with(stock_alert: stock_alert, user: user).notification_email.deliver_later if defined?(StockAlertMailer)
    end
  end
end
