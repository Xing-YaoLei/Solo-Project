Sidekiq.configure_server do |config|
  schedule_file = Rails.root.join("config", "recurring.yml")
  if File.exist?(schedule_file) && Sidekiq.server?
    Sidekiq::Cron::Job.load_from_hash! YAML.load_file(schedule_file)[Rails.env] || {}
  end
end

Sidekiq.configure_client do |config|
end
