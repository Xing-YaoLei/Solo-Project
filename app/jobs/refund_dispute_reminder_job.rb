class RefundDisputeReminderJob < ApplicationJob
  queue_as :default

  def perform
    RefundDispute.where(status: %w[pending processing])
                 .where("created_at <= ?", 24.hours.ago)
                 .includes(:handler, :ticket_order, ticket_order: :event)
                 .find_each do |dispute|
      RefundDisputeMailer.remind_handler(dispute).deliver_later
    end
  end
end
