class RefundDisputeNotificationJob < ApplicationJob
  queue_as :default

  def perform(dispute_id)
    dispute = RefundDispute.find_by(id: dispute_id)
    return unless dispute
    return unless dispute.handler.present?

    RefundDisputeMailer.notify_handler(dispute).deliver_later
  end
end
