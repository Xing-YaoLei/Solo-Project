class OperationLogsController < ApplicationController
  def index
    @logs = OperationLog.all
    @logs = @logs.by_operator(params[:operator_id])
    @logs = @logs.by_action(params[:action])
    @logs = @logs.by_target(params[:target_type], params[:target_id])
    if params[:start_date].present? && params[:end_date].present?
      @logs = @logs.by_date_range(params[:start_date], params[:end_date])
    end
    @logs = @logs.includes(:operator, :target).order(created_at: :desc).page(params[:page]).per(30)

    @action_stats = OperationLog.group(:action).count.limit(15)
    @users = User.all
  end

  def show
    @log = OperationLog.find(params[:id])
  end
end
