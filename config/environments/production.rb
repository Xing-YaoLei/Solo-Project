Rails.application.configure do
  config.cache_classes = true
  config.eager_load = ENV["EAGER_LOAD"].present?

  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.action_controller.perform_caching = true
  config.cache_store = :redis_cache_store, { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1") }

  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: ENV["DEFAULT_HOST"], protocol: "https" }

  config.active_storage.service = :amazon

  config.active_support.deprecation = :notify

  config.active_record.dump_schema_after_migration = false

  config.active_record.attributes_for_inspect = [:id]

  config.action_dispatch.default_headers = {
    "X-Frame-Options" => "DENY",
    "X-XSS-Protection" => "0",
    "X-Content-Type-Options" => "nosniff",
    "X-Download-Options" => "noopen",
    "X-Permitted-Cross-Domain-Policies" => "none",
    "Referrer-Policy" => "strict-origin-when-cross-origin"
  }

  config.log_formatter = ::Logger::Formatter.new

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    logger = ActiveSupport::Logger.new($stdout)
    logger.formatter = config.log_formatter
    config.logger = ActiveSupport::TaggedLogging.new(logger)
  end

  config.force_ssl = ENV["FORCE_SSL"].present?
  config.ssl_options = { hsts: { subdomains: true, preload: true } }
end
