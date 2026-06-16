class NotificationsController < ApplicationController
  def index
    @notifications = current_user.notifications.order(created_at: :desc).page(params[:page])
    @unread_count = current_user.notifications.unread.count
  end

  def mark_as_read
    notification = current_user.notifications.find(params[:id])
    notification.update!(read: true)
    redirect_to notifications_path, notice: "通知已标记为已读"
  end

  def mark_all_as_read
    current_user.notifications.unread.update_all(read: true, updated_at: Time.current)
    redirect_to notifications_path, notice: "所有通知已标记为已读"
  end

  private

  def current_user
    User.first || raise("No current user")
  end
end
