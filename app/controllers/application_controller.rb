class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  include Pundit::Authorization

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :role, :phone, :department])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :phone, :department])
  end

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作。"
    redirect_back(fallback_location: root_path)
  end
end
