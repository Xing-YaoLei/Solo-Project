class ApplicationController < ActionController::Base
  include Pundit::Authorization

  allow_browser versions: :modern

  before_action :authenticate_user!
  before_action :set_default_url_options

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  def after_sign_in_path_for(resource)
    role_root_path_for(resource)
  end

  def after_sign_out_path_for(_resource_or_scope)
    new_user_session_path
  end

  private

  def set_default_url_options
    ActionMailer::Base.default_url_options = { host: request.host_with_port }
    Rails.application.routes.default_url_options = { host: request.host_with_port }
  end

  def default_url_options
    { host: request.host_with_port }
  end

  def role_root_path_for(user)
    if user.city_manager?
      manager_root_path
    elsif user.cs?
      cs_root_path
    elsif user.merchant?
      merchants_root_path
    elsif user.rider?
      rider_root_path
    else
      root_path
    end
  end

  def user_not_authorized
    flash[:alert] = "您没有权限执行此操作。"
    redirect_back(fallback_location: role_root_path_for(current_user))
  end

  def verify_cs_role!
    redirect_to role_root_path_for(current_user), alert: "您没有权限访问此页面。" unless current_user.cs?
  end

  def verify_merchant_role!
    redirect_to role_root_path_for(current_user), alert: "您没有权限访问此页面。" unless current_user.merchant?
  end

  def verify_rider_role!
    redirect_to role_root_path_for(current_user), alert: "您没有权限访问此页面。" unless current_user.rider?
  end

  def verify_manager_role!
    redirect_to role_root_path_for(current_user), alert: "您没有权限访问此页面。" unless current_user.city_manager?
  end

  def sensitive_fields_for(role)
    fields = {
      city_manager: [ :all ],
      cs: [ :merchant_id, :period, :system_amount, :merchant_amount, :difference_amount, :status, :payment_date, :remarks, :handler_id ],
      merchant: [ :merchant_id, :period, :merchant_amount, :status, :payment_date ],
      rider: [ :id, :status, :amount, :delivery_time ]
    }
    fields[role.to_sym] || []
  end
end
