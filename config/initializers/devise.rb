Devise.setup do |config|
  config.mailer_sender = ENV.fetch("DEVISE_MAILER_SENDER", "noreply@compliance-audit.com")

  require "devise/orm/active_record"

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  config.skip_session_storage = [:http_auth]
  config.stretches = Rails.env.test? ? 1 : 12
  config.reconfirmable = true
  config.confirmation_keys = [:email]
  config.expire_all_remember_me_on_sign_out = true
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.reset_password_within = 6.hours
  config.sign_out_via = :delete
  config.parent_controller = "ApplicationController"

  config.navigational_formats = ["*/*", :html, :turbo_stream]
  config.authentication_keys = [:email]
  config.params_authenticatable = true
  config.http_authenticatable = false

  config.warden do |manager|
    manager.failure_app = ->(env) { Devise::FailureApp.call(env) }
  end
end
