require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module FitnessCourseSettlement
  class Application < Rails::Application
    config.load_defaults 7.2
    config.active_job.queue_adapter = :sidekiq
    config.generators do |g|
      g.test_framework :rspec
      g.fixture_replacement :factory_bot, dir: "spec/factories"
    end
  end
end
