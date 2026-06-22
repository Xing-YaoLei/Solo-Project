class NotificationsController < ApplicationController
  before_action :set_notification, only: [:show, :update]

  def index
    authorize Notification

    add_breadcrumb "消息通知", notifications_path
    @page_title = "消息通知"

    @notifications = policy_scope(Notification)
      .includes(:notifiable)
      .order(read: :asc, created_at: :desc)
      .page(params[:page])
      .per(30)

    @unread_count = policy_scope(Notification).unread.count
  end

  def show
    authorize @notification

    @notification.mark_as_read!

    respond_to do |format|
      format.html do
        if @notification.notifiable
          redirect_to polymorphic_path(@notification.notifiable)
        else
          redirect_to notifications_path
        end
      end
    end
  end

  def update
    authorize @notification

    if @notification.mark_as_read!
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace(dom_id(@notification), partial: "notifications/notification_row", locals: { notification: @notification }),
            turbo_stream.replace("unread_count_badge", partial: "notifications/unread_badge", locals: { count: policy_scope(Notification).unread.count })
          ]
        end
      end
    end
  end

  def mark_all_read
    authorize Notification, :mark_all_read?

    Notification.mark_all_as_read(current_user)

    respond_to do |format|
      format.html { redirect_to notifications_path, notice: "所有消息已标记为已读" }
      format.turbo_stream do
        streams = [
          turbo_stream.replace("unread_count_badge", partial: "notifications/unread_badge", locals: { count: 0 }),
          *render_turbo_flash(notice: "所有消息已标记为已读")
        ]
        if params[:redirect_to] == "list"
          streams << turbo_stream.replace("notifications_list", partial: "notifications/list",
                                         locals: { notifications: policy_scope(Notification).includes(:notifiable).order(read: :asc, created_at: :desc).page(params[:page]).per(30) })
        end
        render turbo_stream: streams
      end
    end
  end

  private

  def set_notification
    @notification = policy_scope(Notification).find(params[:id])
  end
end
