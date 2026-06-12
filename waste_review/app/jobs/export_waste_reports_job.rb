class ExportWasteReportsJob
  include Sidekiq::Job
  include WasteReportCsvExport

  sidekiq_options retry: 2, dead: true, queue: 'exports'

  def perform(status = nil, store_id = nil, start_date = nil, end_date = nil)
    Rails.logger.info "Starting export job with params: status=#{status}, store_id=#{store_id}, start_date=#{start_date}, end_date=#{end_date}"

    reports = WasteReport.includes(:store, :waste_items, :cost_entries, :review_opinions, :abnormal_report)
    reports = reports.by_status(status) if status.present?
    reports = reports.by_store(store_id) if store_id.present?
    reports = reports.by_date_range(start_date, end_date) if start_date.present? && end_date.present?
    reports = reports.recent

    csv_content = generate_csv(reports, start_date: start_date, end_date: end_date)

    tmp_dir = Rails.root.join("tmp", "exports")
    FileUtils.mkdir_p(tmp_dir)

    filename = "报损单导出_#{Time.current.strftime('%Y%m%d%H%M%S')}.csv"
    filepath = tmp_dir.join(filename)

    File.write(filepath, csv_content, encoding: 'UTF-8')

    Rails.logger.info("Exported #{reports.count} waste reports to #{filepath}")
    Rails.logger.info("Export file size: #{File.size(filepath)} bytes")
  rescue StandardError => e
    Rails.logger.error "Export job failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise e
  end
end
