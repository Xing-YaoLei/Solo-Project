class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user, :logged_in?

  private

  def current_user
    @current_user ||= User.first
  end

  def logged_in?
    current_user.present?
  end

  def authenticate_user!
    redirect_to root_path, alert: "请先登录" unless logged_in?
  end

  def log_operation(action, target: nil, reason: nil, details: nil, before_data: {}, after_data: {})
    OperationLog.log!(
      action,
      operator: current_user,
      target: target,
      reason: reason,
      details: details,
      before_data: before_data,
      after_data: after_data,
      ip: request.remote_ip,
      user_agent: request.user_agent
    )
  end
end
