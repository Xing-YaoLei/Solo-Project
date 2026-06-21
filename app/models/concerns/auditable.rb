module Auditable
  extend ActiveSupport::Concern

  included do
    has_many :amount_audit_logs, as: :auditable, dependent: :destroy

    after_update :log_amount_changes, if: :should_log_amount_changes?
  end

  def log_amount_change(old_amount, new_amount, operator, change_reason, change_type = :manual)
    amount_audit_logs.create!(
      operator:,
      old_amount:,
      new_amount:,
      change_reason:,
      change_type:,
      change_amount: new_amount - old_amount
    )
  end

  def audit_logs
    amount_audit_logs.recent
  end

  def audit_logs_by_date(start_date, end_date)
    amount_audit_logs.by_date_range(start_date, end_date).recent
  end

  def audit_logs_by_operator(operator_id)
    amount_audit_logs.by_operator(operator_id).recent
  end

  def total_adjusted_amount
    amount_audit_logs.sum(:change_amount)
  end

  def adjustment_count
    amount_audit_logs.count
  end

  def increase_adjustments
    amount_audit_logs.amount_increased
  end

  def decrease_adjustments
    amount_audit_logs.amount_decreased
  end

  def total_increase_amount
    increase_adjustments.sum(:change_amount)
  end

  def total_decrease_amount
    decrease_adjustments.sum(:change_amount)
  end

  def last_adjustment
    amount_audit_logs.recent.first
  end

  def adjustment_history
    amount_audit_logs.recent.map do |log|
      {
        id: log.id,
        operator: log.operator&.name,
        old_amount: log.old_amount,
        new_amount: log.new_amount,
        change_amount: log.change_amount,
        change_reason: log.change_reason,
        change_type: log.change_type,
        created_at: log.created_at
      }
    end
  end

  def has_adjustments?
    amount_audit_logs.exists?
  end

  def adjustments_by_type
    amount_audit_logs.group(:change_type).count
  end

  private

  def should_log_amount_changes?
    (saved_change_to_system_amount? || saved_change_to_merchant_amount?) && respond_to?(:amount_audit_logs)
  end

  def log_amount_changes
    if saved_change_to_system_amount?
      old_amount, new_amount = saved_change_to_system_amount
      log_amount_change(
        old_amount,
        new_amount,
        Current.user,
        "系统金额自动变更",
        :system_change
      ) if Current.user
    end

    if saved_change_to_merchant_amount?
      old_amount, new_amount = saved_change_to_merchant_amount
      log_amount_change(
        old_amount,
        new_amount,
        Current.user,
        "商家金额自动变更",
        :merchant_change
      ) if Current.user
    end
  end
end
