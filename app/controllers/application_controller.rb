class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include Turbo::Streams::ActionHelper

  before_action :authenticate_user!
  before_action :set_paper_trail_whodunnit
  after_action :verify_authorized, unless: :devise_controller?

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  helper_method :current_user_role, :breadcrumbs

  def current_user_role
    current_user&.role&.to_sym || :guest
  end

  def breadcrumbs
    @breadcrumbs ||= []
  end

  def add_breadcrumb(name, path = nil)
    breadcrumbs << { name: name, path: path }
  end

  private

  def user_not_authorized
    respond_to do |format|
      format.html do
        redirect_back fallback_location: root_path,
                      alert: "您没有权限执行此操作"
      end
      format.turbo_stream do
        render turbo_stream: turbo_stream.append(
          :flash_messages,
          partial: "shared/flash_message",
          locals: { type: "alert", message: "您没有权限执行此操作" }
        )
      end
      format.json do
        render json: { error: "您没有权限执行此操作" }, status: :forbidden
      end
    end
  end

  def record_not_found
    respond_to do |format|
      format.html do
        redirect_back fallback_location: root_path,
                      alert: "记录不存在或已被删除"
      end
      format.json do
        render json: { error: "记录不存在或已被删除" }, status: :not_found
      end
    end
  end

  def page_title
    @page_title ||= "合规审计供应商审计结算台"
  end
  helper_method :page_title

  def turbo_frame_request_id
    request.headers["Turbo-Frame"]
  end

  def render_turbo_flash(notice: nil, alert: nil)
    streams = []
    streams << turbo_stream.append(:flash_messages, partial: "shared/flash_message", locals: { type: "notice", message: notice }) if notice
    streams << turbo_stream.append(:flash_messages, partial: "shared/flash_message", locals: { type: "alert", message: alert }) if alert
    streams
  end
end
