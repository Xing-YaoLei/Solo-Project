class NotificationJob < ApplicationJob
  queue_as :notifications

  def perform(notification_type, **params)
    NotificationService.call(notification_type.to_sym, **params.symbolize_keys)
  rescue StandardError => e
    Rails.logger.error("NotificationJob failed: #{e.message}\n#{e.backtrace.first(10).join("\n")}")
    raise e if Rails.env.development?
  end
end
