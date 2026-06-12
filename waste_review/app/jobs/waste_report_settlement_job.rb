class WasteReportSettlementJob
  include Sidekiq::Job

  sidekiq_options retry: 3, dead: true, queue: 'default'

  def perform(waste_report_id)
    waste_report = WasteReport.find_by(id: waste_report_id)
    return unless waste_report

    Rails.logger.info "Starting settlement for waste_report ##{waste_report_id}"

    waste_report.recalculate_totals!

    unless waste_report.cost_entries.exists?
      waste_report.waste_items.group(:product_name).sum(:subtotal).each do |product_name, _amount|
        waste_report.cost_entries.create!(
          responsible_store: waste_report.store,
          amount: waste_report.waste_items.where(product_name: product_name).sum(:subtotal),
          cost_type: :material,
          note: "自动分摊: #{product_name}"
        )
      end
    end

    SidekiqSafe.perform_async(AnomalyDetectionJob, waste_report_id)

    Rails.logger.info("WasteReport##{waste_report.id} settled successfully. Total cost: #{waste_report.total_cost}, Waste rate: #{waste_report.waste_rate}%")
  rescue StandardError => e
    Rails.logger.error "Settlement failed for waste_report ##{waste_report_id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end
end
