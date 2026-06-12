class AnomalyDetectionJob
  include Sidekiq::Job

  sidekiq_options retry: 3, dead: true

  def perform(waste_report_id)
    waste_report = WasteReport.find_by(id: waste_report_id)
    return unless waste_report&.store

    Rails.logger.info "Starting anomaly detection for waste_report ##{waste_report_id}"

    waste_report.recalculate_totals!

    if waste_report.abnormal?
      abnormal_report = AbnormalReport.generate_from_waste_report(waste_report)
      if abnormal_report.persisted?
        Rails.logger.info "Created abnormal report ##{abnormal_report.id} for waste_report ##{waste_report_id} with severity #{abnormal_report.severity}"
      end
    else
      Rails.logger.info "Waste report ##{waste_report_id} has waste rate #{waste_report.waste_rate}%, no anomaly detected"
    end
  rescue StandardError => e
    Rails.logger.error "Anomaly detection failed for waste_report ##{waste_report_id}: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end
end
