Rails.application.config.active_job.queue_adapter = if Rails.env.production?
  :sidekiq
else
  :async
end
