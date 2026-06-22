class ReportExportJob < ApplicationJob
  queue_as :exports

  def perform(export_record_id)
    export_record = ExportRecord.find_by(id: export_record_id)
    return unless export_record
    return if export_record.completed? || export_record.failed?

    export_record.mark_processing!

    result = ReportExportService.generate_content(export_record)

    if export_record.completed?
      NotificationJob.perform_later(
        :export_completed,
        export_id: export_record.id
      )
    end

    result
  rescue StandardError => e
    Rails.logger.error("ReportExportJob failed: #{e.message}\n#{e.backtrace.first(10).join("\n")}")
    export_record.mark_failed!(e.message) if export_record

    NotificationJob.perform_later(
      :export_failed,
      export_id: export_record&.id,
      error_message: e.message
    )

    raise e if Rails.env.development?
  end
end
