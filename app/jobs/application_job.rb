class ApplicationJob < ActiveJob::Base
  retry_on ActiveRecord::Deadlocked, wait: :exponentially_longer, attempts: 5
  retry_on ActiveRecord::StaleObjectError, wait: 3.seconds, attempts: 3
  retry_on Redis::CannotConnectError, wait: :exponentially_longer, attempts: 5
  retry_on Pg::ConnectionBad, wait: :exponentially_longer, attempts: 5

  discard_on ActiveJob::DeserializationError

  around_perform do |job, block|
    job_id = job.job_id
    Rails.logger.info("[#{Time.current}] Job started: #{job.class.name} #{job_id}")
    started_at = Time.current

    begin
      block.call
      duration = ((Time.current - started_at) * 1000).round
      Rails.logger.info("[#{Time.current}] Job completed: #{job.class.name} #{job_id} (#{duration}ms)")
    rescue StandardError => e
      duration = ((Time.current - started_at) * 1000).round
      Rails.logger.error("[#{Time.current}] Job failed: #{job.class.name} #{job_id} after #{duration}ms\nError: #{e.message}")
      raise
    end
  end
end
