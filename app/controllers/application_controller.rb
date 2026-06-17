class ApplicationController < ActionController::Base
  before_action :set_current_operator
  helper_method :current_operator_name

  private

  def set_current_operator
    Thread.current[:current_operator_id] = session[:operator_id] || params[:operator_id]
  end

  def current_operator_name
    session[:operator_id].present? ? "operator_#{session[:operator_id]}" : nil
  end
end
