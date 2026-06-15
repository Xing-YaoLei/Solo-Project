class SettlementCalculationJob < ApplicationJob
  queue_as :default

  def perform(settlement_id)
    settlement = Settlement.find(settlement_id)
    settlement.perform_calculation!
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "Settlement not found: #{settlement_id}"
  end
end
