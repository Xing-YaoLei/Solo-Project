class SettlementReassignmentService
  def initialize(settlement, current_user, new_handler)
    @settlement = settlement
    @current_user = current_user
    @new_handler = new_handler
  end

  def reassign
    ActiveRecord::Base.transaction do
      old_handler = @settlement.handler

      @settlement.update!(handler: @new_handler)

      TodoItem.create!(
        settlement: @settlement,
        assignee: @new_handler,
        assigner: @current_user,
        title: "结算单已重新分配给您 - #{@settlement.period}",
        description: "原处理人: #{old_handler&.name || '未分配'}\n请及时处理该结算单。",
        priority: :high,
        status: :pending,
        due_date: 3.days.from_now.to_date
      )

      if old_handler && old_handler != @new_handler
        TodoItem.create!(
          settlement: @settlement,
          assignee: old_handler,
          assigner: @current_user,
          title: "结算单已转派 - #{@settlement.period}",
          description: "该结算单已转派给 #{@new_handler.name} 处理。",
          priority: :low,
          status: :pending,
          due_date: 1.day.from_now.to_date
        )
      end

      @settlement.discrepancies.unresolved.each do |discrepancy|
        discrepancy.todo_items.incomplete.each do |todo|
          if todo.assignee == old_handler
            todo.update!(assignee: @new_handler)
          end
        end
      end

      NotificationWorker.perform_async(@new_handler.id, 'settlement_reassigned')

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Reassign settlement failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def self.batch_reassign(settlement_ids, current_user, new_handler)
    ActiveRecord::Base.transaction do
      settlements = Settlement.where(id: settlement_ids)
      settlements.each do |settlement|
        service = new(settlement, current_user, new_handler)
        service.reassign
      end
      settlements
    end
  rescue StandardError => e
    Rails.logger.error "Batch reassign settlements failed: #{e.message}"
    raise e
  end
end
