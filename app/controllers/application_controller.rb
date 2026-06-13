class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  before_action :require_user

  helper_method :current_user, :logged_in?

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def logged_in?
    !!current_user
  end

  def require_user
    unless logged_in?
      flash[:alert] = "请先登录"
      redirect_to login_path
    end
  end

  def require_reviewer
    unless current_user&.reviewer?
      flash[:alert] = "没有权限执行此操作"
      redirect_to root_path
    end
  end

  def require_admin
    unless current_user&.admin?
      flash[:alert] = "没有权限执行此操作"
      redirect_to root_path
    end
  end
end

