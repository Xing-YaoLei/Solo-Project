class DenialNotificationWorker
  include Sidekiq::Worker

  def perform(notification_id)
    notification = Notification.find_by(id: notification_id)
    return unless notification

    SettlementMailer.denial_notification(notification).deliver_later

    broadcast_notification_count(notification.user)
  end

  private

  def broadcast_notification_count(user)
    unread_count = user.notifications.unread.count
    Turbo::StreamsChannel.broadcast_replace_to(
      "notifications:#{user.id}",
      target: "notification_count",
      html: ApplicationController.render(
        partial: "notifications/notification_count",
        locals: { unread_count: unread_count }
      )
    )
  end
end
