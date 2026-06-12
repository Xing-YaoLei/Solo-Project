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
    rescue StandardError => e
      Rails.logger.warn "Failed to queue #{job_class} via Sidekiq (#{e.class}: #{e.message}), executing inline instead"
      begin
        job_class.new.perform(*args)
      rescue StandardError => inner_e
        Rails.logger.error "Inline execution of #{job_class} also failed: #{inner_e.message}"
        Rails.logger.error inner_e.backtrace.first(5).join("\n") if inner_e.backtrace
      end
    end
  end
end
