class ApplicationController < ActionController::Base
  include Pagy::Backend

  helper Pagy::Frontend

  allow_browser versions: :modern

  helper_method :current_user

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) || User.first
  end
end
