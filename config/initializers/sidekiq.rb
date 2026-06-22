Sidekiq.configure_server do |config|
  config.redis = {
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"),
    network_timeout: 5,
    pool_timeout: 3
  }

  config.average_scheduled_poll_interval = 5
  config.strict = false
end

Sidekiq.configure_client do |config|
  config.redis = {
    url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"),
    network_timeout: 5,
    pool_timeout: 3
  }
end

Sidekiq.default_job_options = {
  retry: 3,
  backtrace: true
}
