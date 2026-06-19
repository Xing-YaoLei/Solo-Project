class StatusLogsController < ApplicationController
  def index
    @status_logs = StatusLog.includes(:trackable).recent
    @status_logs = @status_logs.where(trackable_type: params[:trackable_type]) if params[:trackable_type].present?
    @status_logs = @status_logs.where(event: params[:event]) if params[:event].present?
    @status_logs = paginate(@status_logs, per_page: 30)
  end
end
