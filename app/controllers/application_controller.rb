class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  before_action :set_current_user

  def current_user
    return @current_user if defined?(@current_user)
    @current_user = User.find_by(id: session[:user_id])
    @current_user ||= User.first if Rails.env.development?
    Current.user = @current_user
    @current_user
  end
  helper_method :current_user

  private

  def set_current_user
    Current.user = current_user
  end

  def open_conflicts_count
    @open_conflicts_count ||= RoomConflict.visible_to(current_user).open.count
  end
  helper_method :open_conflicts_count
end
