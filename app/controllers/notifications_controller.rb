class NotificationsController < ApplicationController
  def index
    @notifications = Notification.recent
    @notifications = @notifications.by_role(params[:role]) if params[:role].present?
    @notifications = @notifications.unread if params[:unread] == "true"
  end

  def mark_read
    notification = Notification.find(params[:id])
    notification.mark_as_read!
    redirect_to notifications_url, notice: "已标记为已读"
  end

  def mark_all_read
    Notification.unread.update_all(read_at: Time.current)
    redirect_to notifications_url, notice: "全部已标记为已读"
  end
end
