class Users::SessionsController < Devise::SessionsController
  after_action :track_login, only: [:create]

  def new
    self.resource = resource_class.new(sign_in_params)
    clean_up_passwords(resource)
    yield resource if block_given?
    respond_with(resource, serialize_options(resource))
  end

  private

  def track_login
    return unless resource.persisted?
    Rails.logger.info "[Login] User #{resource.id} (#{resource.email}) logged in at #{Time.current}"
  end

  def after_sign_in_path_for(resource)
    stored_location_for(resource) || dashboard_path
  end

  def after_sign_out_path_for(_resource_or_scope)
    new_user_session_path
  end
end
