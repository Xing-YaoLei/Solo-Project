class SettlementRejectionService
  def initialize(settlement, current_user, reason = nil)
    @settlement = settlement
    @current_user = current_user
    @reason = reason
  end

  def reject
    ActiveRecord::Base.transaction do
      old_status = @settlement.status

      @settlement.update!(
        status: :rejected,
        handler: @current_user,
        metadata: @settlement.metadata.merge(rejection_reason: @reason, rejected_at: Time.current, rejected_by: @current_user.id)
      )

      AmountAuditLog.create!(
        settlement: @settlement,
        operator: @current_user,
        old_amount: @settlement.system_amount,
        new_amount: @settlement.system_amount,
        change_reason: "结算单驳回: #{@reason || '无原因'}",
        change_type: 'rejection'
      )

      @settlement.approval_records.each do |record|
        record.update!(decision: :rejected, comment: @reason) if record.pending?
      end

      TodoItem.create!(
        settlement: @settlement,
        assignee: @settlement.handler || @current_user,
        assigner: @current_user,
        title: "结算单已驳回 - #{@settlement.period}",
        description: "驳回原因: #{@reason || '无原因'}\n请修改后重新提交。",
        priority: :high,
        status: :pending,
        due_date: 3.days.from_now.to_date
      )

      NotificationWorker.perform_async(@settlement.merchant_id, 'settlement_rejected') if @settlement.merchant_id

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Reject settlement failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def resubmit(updated_amount = nil)
    ActiveRecord::Base.transaction do
      if updated_amount
        old_amount = @settlement.system_amount
        @settlement.update!(
          system_amount: updated_amount,
          difference_amount: updated_amount - @settlement.merchant_amount
        )

        AmountAuditLog.create!(
          settlement: @settlement,
          operator: @current_user,
          old_amount: old_amount,
          new_amount: updated_amount,
          change_reason: "重新提交修改金额",
          change_type: 'resubmit'
        )

        if @settlement.difference_amount != 0
          discrepancy = @settlement.discrepancies.create!(
            difference_amount: @settlement.difference_amount,
            status: :pending,
            description: "重新提交后仍存在金额差异"
          )

          User.by_role(:cs).each do |cs_user|
            TodoItem.create!(
              settlement: @settlement,
              discrepancy: discrepancy,
              assignee: cs_user,
              title: "处理重新提交的结算单差异 - #{@settlement.period}",
              description: "差异金额: #{sprintf("%.2f", @settlement.difference_amount)}元",
              priority: discrepancy_priority(@settlement.difference_amount),
              status: :pending,
              due_date: 3.days.from_now.to_date
            )
          end
        end
      end

      @settlement.update!(status: :pending)

      TodoItem.create!(
        settlement: @settlement,
        assignee: @current_user,
        assigner: @current_user,
        title: "结算单已重新提交 - #{@settlement.period}",
        description: "请等待审批。",
        priority: :medium,
        status: :pending,
        due_date: 5.days.from_now.to_date
      )

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Resubmit settlement failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  private

  def discrepancy_priority(amount)
    if amount.abs >= 10000
      :urgent
    elsif amount.abs >= 5000
      :high
    elsif amount.abs >= 1000
      :medium
    else
      :low
    end
  end
end
