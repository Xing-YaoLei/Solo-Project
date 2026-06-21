class ReportGenerationWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 2, backtrace: true

  def perform(report_type, params = {})
    @report_type = report_type.to_sym
    @params = params.symbolize_keys

    Rails.logger.info "Starting report generation: #{@report_type}, params: #{@params}"

    result = generate_report

    if result[:success]
      Rails.logger.info "Report generated successfully: #{@report_type}, file: #{result[:file_path]}"
      send_report_notification(result)
    else
      Rails.logger.error "Report generation failed: #{@report_type}, error: #{result[:error]}"
    end

    result
  end

  private

  def generate_report
    service = case @report_type
              when :payment_cycle
                Reports::PaymentCycleService.new(@params)
              when :by_date
                Reports::ByDateService.new(@params)
              when :by_owner
                Reports::ByOwnerService.new(@params)
              else
                raise ArgumentError, "Unsupported report type: #{@report_type}"
              end

    data = service.generate
    format = @params[:format] || :xlsx
    file_path = service.export(format)

    { success: true, file_path:, data:, format: }
  rescue StandardError => e
    { success: false, error: e.message, backtrace: e.backtrace.first(10) }
  end

  def send_report_notification(result)
    return unless @params[:user_id]

    NotificationWorker.perform_async(
      @params[:user_id],
      'report_ready',
      @report_type,
      result[:file_path]
    )
  end
end
