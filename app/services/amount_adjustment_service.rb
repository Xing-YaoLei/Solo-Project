class AmountAdjustmentService
  def initialize(settlement, current_user)
    @settlement = settlement
    @current_user = current_user
  end

  def adjust_amount(new_amount, change_reason, adjustment_type = :manual)
    ActiveRecord::Base.transaction do
      validate_amount(new_amount)

      old_amount = @settlement.system_amount
      difference = new_amount - old_amount

      return @settlement if difference.zero?

      @settlement.update!(
        system_amount: new_amount,
        difference_amount: new_amount - @settlement.merchant_amount
      )

      audit_log = log_change(old_amount, new_amount, change_reason, adjustment_type)

      create_adjustment_todo(difference, change_reason)
      NotificationWorker.perform_async(@settlement.merchant_id, :amount_adjusted, @settlement.id)

      { settlement: @settlement, audit_log: }
    end
  rescue StandardError => e
    Rails.logger.error "Amount adjustment failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def validate_amount(amount)
    unless amount.is_a?(Numeric)
      raise ArgumentError, "金额必须为数字"
    end

    if amount.negative?
      raise ArgumentError, "结算金额不能为负数"
    end

    if amount > 10_000_000
      raise ArgumentError, "结算金额过大，单笔超过1000万需要特殊审批"
    end

    true
  end

  def log_change(old_amount, new_amount, change_reason, adjustment_type)
    AmountAuditLog.create!(
      settlement: @settlement,
      operator: @current_user,
      old_amount:,
      new_amount:,
      change_reason:,
      change_type: adjustment_type,
      change_amount: new_amount - old_amount
    )
  end

  def adjust_merchant_amount(new_amount, change_reason)
    ActiveRecord::Base.transaction do
      validate_amount(new_amount)

      old_amount = @settlement.merchant_amount

      @settlement.update!(
        merchant_amount: new_amount,
        difference_amount: @settlement.system_amount - new_amount
      )

      log_change(old_amount, new_amount, change_reason, :merchant_adjustment)

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Merchant amount adjustment failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def bulk_adjust(adjustments)
    ActiveRecord::Base.transaction do
      results = []

      adjustments.each do |adjustment|
        settlement = Settlement.find(adjustment[:settlement_id])
        service = self.class.new(settlement, @current_user)
        result = service.adjust_amount(
          adjustment[:new_amount],
          adjustment[:change_reason],
          adjustment[:adjustment_type] || :manual
        )
        results << result
      end

      results
    end
  rescue StandardError => e
    Rails.logger.error "Bulk amount adjustment failed: #{e.message}"
    raise e
  end

  private

  def create_adjustment_todo(difference, change_reason)
    cs_users = User.by_role(:cs)
    cs_users.each do |cs_user|
      TodoItem.create!(
        settlement: @settlement,
        assignee: cs_user,
        assigner: @current_user,
        title: "金额调整通知 - 结算单 #{@settlement.id}",
        description: "调整金额: #{sprintf("%+.2f", difference)}元\n调整原因: #{change_reason}",
        priority: difference.abs >= 5000 ? :high : :medium,
        status: :pending,
        due_date: 2.business_days.from_now
      )
    end
  end
end
