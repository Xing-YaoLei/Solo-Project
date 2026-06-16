class SettlementProcessor
  def submit_settlement(settlement)
    raise "结算单状态不是待提交" unless settlement.pending?

    settlement.update!(status: :submitted, submitted_at: Date.current)
    settlement
  end

  def process_denial(settlement, reason, operator)
    raise "只能驳回已提交的结算单" unless settlement.submitted?

    ActiveRecord::Base.transaction do
      settlement.update!(status: :denied)
      settlement.denial_actions.create!(
        action_type: :deny,
        reason: reason,
        operator: operator,
        performed_at: Time.current
      )
    end

    DenialNotifier.new.notify_responsible_persons(settlement)
    settlement
  end

  def process_supplement(settlement, materials, reason, operator)
    raise "只能对已驳回的结算单补充材料" unless settlement.denied?

    ActiveRecord::Base.transaction do
      settlement.denial_actions.create!(
        action_type: :supplement,
        reason: reason,
        materials: materials,
        operator: operator,
        performed_at: Time.current
      )
      settlement.update!(status: :submitted)
    end

    settlement
  end

  def process_retry(settlement, reason, operator)
    raise "只能对已驳回的结算单重新提交" unless settlement.denied?

    ActiveRecord::Base.transaction do
      settlement.denial_actions.create!(
        action_type: :retry,
        reason: reason,
        operator: operator,
        performed_at: Time.current
      )
      settlement.update!(status: :submitted)
    end

    settlement
  end

  def process_close(settlement, reason, operator)
    raise "只能对已驳回的结算单关闭" unless settlement.denied?

    ActiveRecord::Base.transaction do
      settlement.denial_actions.create!(
        action_type: :close,
        reason: reason,
        operator: operator,
        performed_at: Time.current
      )
      settlement.update!(status: :closed)
    end

    settlement
  end
end
