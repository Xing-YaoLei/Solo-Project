class BatchSettlementWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 3, backtrace: true

  def perform(merchant_ids = nil, period = nil)
    @period = period || default_period
    @merchants = fetch_merchants(merchant_ids)
    @results = { success: [], failed: [], skipped: [] }

    Rails.logger.info "Starting batch settlement for period #{@period}, merchants count: #{@merchants.count}"

    process_merchants
    send_summary_notification

    Rails.logger.info "Batch settlement completed: #{@results[:success].count} success, #{@results[:failed].count} failed, #{@results[:skipped].count} skipped"

    @results
  end

  private

  def process_merchants
    @merchants.find_each do |merchant|
      process_single_merchant(merchant)
    end
  end

  def process_single_merchant(merchant)
    existing_settlement = merchant.settlements.by_period(@period).first
    if existing_settlement && existing_settlement.approved?
      @results[:skipped] << { merchant_id: merchant.id, reason: "已审批通过" }
      return
    end

    service = SettlementCalculatorService.new(merchant, @period)
    settlement = service.call

    @results[:success] << {
      merchant_id: merchant.id,
      settlement_id: settlement.id,
      system_amount: settlement.system_amount,
      merchant_amount: settlement.merchant_amount,
      difference_amount: settlement.difference_amount
    }
  rescue StandardError => e
    @results[:failed] << {
      merchant_id: merchant.id,
      error: e.message
    }
    Rails.logger.error "Batch settlement failed for merchant #{merchant.id}: #{e.message}"
    nil
  end

  def send_summary_notification
    city_managers = User.by_role(:city_manager)
    city_managers.each do |manager|
      NotificationWorker.perform_async(
        manager.id,
        :batch_settlement_summary,
        @period,
        @results[:success].count,
        @results[:failed].count,
        @results[:skipped].count
      )
    end
  end

  def fetch_merchants(merchant_ids)
    if merchant_ids.present?
      Merchant.where(id: merchant_ids).active
    else
      Merchant.active
    end
  end

  def default_period
    1.month.ago.strftime("%Y-%m")
  end
end
