class PaymentScheduleWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 3, backtrace: true

  def perform(settlement_id = nil)
    if settlement_id
      process_single_settlement(settlement_id)
    else
      process_all_pending_settlements
    end
  end

  private

  def process_all_pending_settlements
    settlements = Settlement.includes(:merchant)
      .by_status(:approved)
      .where(payment_scheduled: false)
      .where("payment_date <= ?", 7.days.from_now.to_date)

    Rails.logger.info "Found #{settlements.count} settlements to schedule payments"

    settlements.find_each do |settlement|
      process_single_settlement(settlement.id)
    end
  end

  def process_single_settlement(settlement_id)
    settlement = Settlement.find(settlement_id)
    return unless settlement.approved?
    return if settlement.payment_scheduled?

    Rails.logger.info "Scheduling payment for settlement #{settlement.id}"

    ActiveRecord::Base.transaction do
      payment_schedule = create_payment_schedule(settlement)
      update_settlement_status(settlement)
      create_payment_todos(settlement)
      schedule_reminders(settlement)
    end

    { success: true, settlement_id: }
  rescue StandardError => e
    Rails.logger.error "Payment schedule failed for settlement #{settlement_id}: #{e.message}"
    { success: false, settlement_id:, error: e.message }
  end

  def create_payment_schedule(settlement)
    PaymentSchedule.create!(
      settlement:,
      merchant: settlement.merchant,
      scheduled_date: settlement.payment_date,
      amount: settlement.system_amount,
      status: :scheduled,
      payment_method: determine_payment_method(settlement.merchant),
      bank_account: settlement.merchant.bank_account,
      bank_name: settlement.merchant.bank_name,
      account_name: settlement.merchant.account_name
    )
  end

  def update_settlement_status(settlement)
    settlement.update!(
      payment_scheduled: true,
      payment_scheduled_at: Time.current,
      status: :processing
    )
  end

  def create_payment_todos(settlement)
    finance_users = User.by_role(:finance)
    finance_users.each do |finance_user|
      TodoItem.create!(
        settlement:,
        assignee: finance_user,
        title: "待付款 - 结算单 #{settlement.id}",
        description: "#{settlement.merchant.name} #{settlement.period} 结算单待付款\n金额：#{sprintf("%.2f", settlement.system_amount)}元\n付款日期：#{settlement.payment_date}",
        priority: :high,
        status: :pending,
        due_date: settlement.payment_date
      )
    end
  end

  def schedule_reminders(settlement)
    reminder_date = settlement.payment_date - 3.days
    PaymentReminderWorker.perform_at(reminder_date.beginning_of_day, settlement.id) if reminder_date > Date.current
  end

  def determine_payment_method(merchant)
    merchant.preferred_payment_method || :bank_transfer
  end
end

class PaymentSchedule < ApplicationRecord
  belongs_to :settlement
  belongs_to :merchant

  enum :status, { scheduled: 0, processing: 1, completed: 2, failed: 3 }
  enum :payment_method, { bank_transfer: 0, alipay: 1, wechat: 2 }

  validates :scheduled_date, presence: true
  validates :amount, numericality: true

  scope :by_status, ->(status) { where(status: status) }
  scope :by_date, ->(date) { where(scheduled_date: date) }
  scope :due_soon, -> { where(scheduled_date: Date.today..7.days.from_now) }
  scope :overdue, -> { where("scheduled_date < ? AND status != ?", Date.today, statuses[:completed]) }
end

class PaymentReminderWorker
  include Sidekiq::Worker

  def perform(settlement_id)
    settlement = Settlement.find_by(id: settlement_id)
    return unless settlement&.payment_scheduled? && !settlement.completed?

    NotificationWorker.perform_async(settlement.merchant_id, 'payment_reminder', settlement.id)

    finance_users = User.by_role(:finance)
    finance_users.each do |user|
      NotificationWorker.perform_async(user.id, 'payment_reminder', settlement.id)
    end
  end
end
