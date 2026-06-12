begin
  require "sidekiq"

  redis_url = ENV.fetch("REDIS_URL", "redis://localhost:6379/0")

  Sidekiq.configure_server do |config|
    config.redis = { url: redis_url, connect_timeout: 1, reconnect_attempts: 0 }
    config.concurrency = 5
    config.logger.level = Logger::INFO
  end

  Sidekiq.configure_client do |config|
    config.redis = { url: redis_url, connect_timeout: 1, reconnect_attempts: 0 }
  end
rescue StandardError => e
  Rails.logger.warn "Sidekiq configuration failed: #{e.message}"
end

module SidekiqSafe
  def self.perform_async(job_class, *args)
    begin
      job_class.perform_async(*args)
    rescue RedisClient::CannotConnectError, Errno::ECONNREFUSED => e
      Rails.logger.warn "Redis unavailable, executing #{job_class} inline: #{e.message}"
      job_class.new.perform(*args)
    rescue StandardError => e
      Rails.logger.error "Failed to queue #{job_class}: #{e.message}"
      begin
        job_class.new.perform(*args)
      rescue StandardError => inner_e
        Rails.logger.error "Inline execution also failed: #{inner_e.message}"
      end
    end
  end
end
