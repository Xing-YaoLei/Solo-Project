class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  before_action :set_current_user

  def current_user
    Current.user ||= User.first
  end
  helper_method :current_user

  private

  def set_current_user
    Current.user = current_user
  end

  def open_conflicts_count
    @open_conflicts_count ||= RoomConflict.open.count
  end
  helper_method :open_conflicts_count
end
