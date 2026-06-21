class Users::SessionsController < Devise::SessionsController
  skip_forgery_protection only: [:create]

  def after_sign_in_path_for(resource)
    if resource.city_manager?
      manager_dashboard_path
    elsif resource.cs?
      cs_dashboard_path
    elsif resource.merchant?
      merchants_dashboard_path
    elsif resource.rider?
      rider_dashboard_path
    else
      super
    end
  end

  def after_sign_out_path_for(resource)
    new_user_session_path
  end
end
