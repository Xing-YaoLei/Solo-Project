require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module Mp0164
  class Application < Rails::Application
    config.load_defaults 7.2
    config.active_job.queue_adapter = :sidekiq
    config.time_zone = "Beijing"
    config.i18n.default_locale = :"zh-CN"
  end
end
