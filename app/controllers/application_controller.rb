class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  before_action :set_current_user

  def current_user
    @current_user ||= User.first
  end
  helper_method :current_user

  private

  def set_current_user
    @current_user = current_user
  end
end
