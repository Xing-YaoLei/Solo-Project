require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module ComplianceAudit
  class Application < Rails::Application
    config.load_defaults 7.2

    config.generators do |g|
      g.orm :active_record, primary_key_type: :uuid
      g.test_framework :rspec,
        fixtures: true,
        view_specs: false,
        helper_specs: false,
        routing_specs: false,
        controller_specs: true,
        request_specs: true
      g.fixture_replacement :factory_bot, dir: "spec/factories"
      g.helper false
      g.assets false
      g.stylesheets false
      g.javascripts false
    end

    config.i18n.default_locale = :"zh-CN"
    config.i18n.available_locales = [:"zh-CN", :en]
    config.time_zone = "Beijing"
    config.active_record.default_timezone = :local

    config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
    config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
    config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]

    config.active_job.queue_adapter = :sidekiq

    config.assets.paths << Rails.root.join("app", "assets", "builds")

    config.action_mailer.delivery_method = :smtp
    config.action_mailer.smtp_settings = {
      address: ENV["SMTP_ADDRESS"],
      port: ENV["SMTP_PORT"],
      domain: ENV["SMTP_DOMAIN"],
      user_name: ENV["SMTP_USERNAME"],
      password: ENV["SMTP_PASSWORD"],
      authentication: "plain",
      enable_starttls_auto: true
    }

    config.active_storage.service = :local
    config.active_storage.variant_processor = :mini_magick

    config.action_controller.per_form_csrf_tokens = true
    config.action_controller.forgery_protection_origin_check = true

    config.log_tags = [:request_id, :remote_ip, ->(req) { req.session[:user_id] }]

    initializer :add_health_check_routes, after: :add_routing_paths do |app|
      app.routes.prepend do
        get "health" => "health#index"
      end
    end
  end
end
