class DataSyncWorker
  include Sidekiq::Worker

  sidekiq_options queue: :data_sync, retry: 2, backtrace: true

  def perform(sync_type, params = {})
    @sync_type = sync_type.to_sym
    @params = params.symbolize_keys
    @start_time = Time.current

    Rails.logger.info "Starting data sync: #{@sync_type}, params: #{@params}"

    result = execute_sync

    log_sync_result(result)
    notify_sync_result(result)

    result
  end

  private

  def execute_sync
    case @sync_type
    when :delivery_orders
      sync_delivery_orders
    when :merchant_data
      sync_merchant_data
    when :settlement_data
      sync_settlement_data
    when :user_data
      sync_user_data
    when :full_sync
      run_full_sync
    else
      raise ArgumentError, "Unsupported sync type: #{@sync_type}"
    end

    { success: true, sync_type: @sync_type, record_count: @record_count || 0 }
  rescue StandardError => e
    Rails.logger.error "Data sync failed #{@sync_type}: #{e.message}"
    { success: false, sync_type: @sync_type, error: e.message, backtrace: e.backtrace.first(10) }
  end

  def sync_delivery_orders
    Rails.logger.info "Syncing delivery orders..."

    last_sync = DataSyncLog.where(sync_type: :delivery_orders).order(created_at: :desc).first
    start_date = last_sync ? last_sync.created_at : 7.days.ago
    end_date = @params[:end_date]&.to_date || Date.current

    delivery_orders = fetch_external_delivery_orders(start_date, end_date)
    @record_count = delivery_orders.count

    delivery_orders.each do |external_order|
      sync_single_delivery_order(external_order)
    end

    Rails.logger.info "Synced #{@record_count} delivery orders"
  end

  def sync_merchant_data
    Rails.logger.info "Syncing merchant data..."

    merchants = fetch_external_merchants
    @record_count = merchants.count

    merchants.each do |external_merchant|
      sync_single_merchant(external_merchant)
    end

    Rails.logger.info "Synced #{@record_count} merchants"
  end

  def sync_settlement_data
    Rails.logger.info "Syncing settlement data..."

    period = @params[:period] || 1.month.ago.strftime("%Y-%m")
    settlements = fetch_external_settlements(period)
    @record_count = settlements.count

    settlements.each do |external_settlement|
      sync_single_settlement(external_settlement)
    end

    Rails.logger.info "Synced #{@record_count} settlements"
  end

  def sync_user_data
    Rails.logger.info "Syncing user data..."

    users = fetch_external_users
    @record_count = users.count

    users.each do |external_user|
      sync_single_user(external_user)
    end

    Rails.logger.info "Synced #{@record_count} users"
  end

  def run_full_sync
    Rails.logger.info "Running full data sync..."

    total_count = 0

    %i[delivery_orders merchant_data settlement_data user_data].each do |type|
      @sync_type = type
      result = execute_sync
      total_count += result[:record_count] if result[:success]
    end

    @record_count = total_count
    @sync_type = :full_sync
  end

  def sync_single_delivery_order(external_order)
    merchant = Merchant.find_or_create_by!(external_id: external_order[:merchant_id]) do |m|
      m.name = external_order[:merchant_name]
    end

    rider = User.find_or_create_by!(external_id: external_order[:rider_id]) do |u|
      u.name = external_order[:rider_name]
      u.role = :rider
      u.phone = external_order[:rider_phone]
      u.password = SecureRandom.hex(8)
    end

    DeliveryOrder.find_or_initialize_by(order_no: external_order[:order_no]).tap do |order|
      order.assign_attributes(
        merchant:,
        rider:,
        amount: external_order[:amount],
        status: external_order[:status] || :delivered,
        delivery_time: external_order[:delivery_time],
        external_data: external_order
      )
      order.save!
    end
  end

  def sync_single_merchant(external_merchant)
    Merchant.find_or_initialize_by(external_id: external_merchant[:external_id]).tap do |merchant|
      merchant.assign_attributes(
        name: external_merchant[:name],
        contact_name: external_merchant[:contact_name],
        contact_phone: external_merchant[:contact_phone],
        address: external_merchant[:address],
        city_id: external_merchant[:city_id],
        active: external_merchant[:active] != false,
        bank_account: external_merchant[:bank_account],
        bank_name: external_merchant[:bank_name],
        account_name: external_merchant[:account_name]
      )
      merchant.save!
    end
  end

  def sync_single_settlement(external_settlement)
    merchant = Merchant.find_by(external_id: external_settlement[:merchant_id])
    return unless merchant

    Settlement.find_or_initialize_by(merchant:, period: external_settlement[:period]).tap do |s|
      s.assign_attributes(
        merchant_amount: external_settlement[:merchant_amount],
        external_data: external_settlement
      )
      s.save!
    end
  end

  def sync_single_user(external_user)
    User.find_or_initialize_by(external_id: external_user[:external_id]).tap do |user|
      user.assign_attributes(
        name: external_user[:name],
        phone: external_user[:phone],
        role: external_user[:role] || :cs,
        city_id: external_user[:city_id],
        merchant_id: external_user[:merchant_id]
      )
      user.password = SecureRandom.hex(8) if user.new_record?
      user.save!
    end
  end

  def fetch_external_delivery_orders(start_date, end_date)
    Rails.logger.info "Fetching delivery orders from #{start_date} to #{end_date}"
    []
  end

  def fetch_external_merchants
    Rails.logger.info "Fetching merchants from external system"
    []
  end

  def fetch_external_settlements(period)
    Rails.logger.info "Fetching settlements for period #{period}"
    []
  end

  def fetch_external_users
    Rails.logger.info "Fetching users from external system"
    []
  end

  def log_sync_result(result)
    DataSyncLog.create!(
      sync_type: @sync_type,
      status: result[:success] ? :success : :failed,
      record_count: result[:record_count] || 0,
      error_message: result[:error],
      started_at: @start_time,
      completed_at: Time.current,
      params: @params
    )
  end

  def notify_sync_result(result)
    if result[:success]
      admin_users = User.by_role(:city_manager)
      admin_users.each do |user|
        NotificationWorker.perform_async(user.id, :data_sync_completed, @sync_type, result[:record_count])
      end
    else
      admin_users = User.by_role(:city_manager)
      admin_users.each do |user|
        NotificationWorker.perform_async(user.id, :data_sync_failed, @sync_type, result[:error])
      end
    end
  end
end

class DataSyncLog < ApplicationRecord
  enum :status, { pending: 0, processing: 1, success: 2, failed: 3 }
  enum :sync_type, { delivery_orders: 0, merchant_data: 1, settlement_data: 2, user_data: 3, full_sync: 4 }

  scope :by_type, ->(type) { where(sync_type: type) }
  scope :by_status, ->(status) { where(status: status) }
  scope :recent, -> { order(created_at: :desc) }
  scope :successful, -> { where(status: :success) }
  scope :failed, -> { where(status: :failed) }
end
