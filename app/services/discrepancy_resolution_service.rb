class DiscrepancyResolutionService
  def initialize(discrepancy, current_user)
    @discrepancy = discrepancy
    @current_user = current_user
  end

  def resolve(resolution_type, new_amount, comment = nil)
    ActiveRecord::Base.transaction do
      settlement = @discrepancy.settlement
      old_amount = settlement.system_amount

      settlement.update!(
        system_amount: new_amount,
        difference_amount: new_amount - settlement.merchant_amount
      )

      AmountAuditLog.create!(
        settlement:,
        operator: @current_user,
        old_amount:,
        new_amount:,
        change_reason: "差异解决: #{resolution_type} - #{comment || '无备注'}",
        change_type: resolution_type
      )

      @discrepancy.update!(
        status: :resolved,
        resolution_type:,
        resolved_at: Time.current,
        resolved_by: @current_user.id,
        comment:
      )

      complete_discrepancy_todos("差异已解决")
      NotificationWorker.perform_async(settlement.merchant_id, 'discrepancy_resolved')

      @discrepancy
    end
  rescue StandardError => e
    Rails.logger.error "Resolve discrepancy failed for discrepancy #{@discrepancy.id}: #{e.message}"
    raise e
  end

  def escalate(comment = nil)
    ActiveRecord::Base.transaction do
      @discrepancy.update!(
        status: :investigating,
        comment:
      )

      city_managers = User.by_role(:city_manager)
      city_managers.each do |manager|
        TodoItem.create!(
          settlement: @discrepancy.settlement,
          discrepancy: @discrepancy,
          assignee: manager,
          assigner: @current_user,
          title: "差异升级处理 - 结算单 #{@discrepancy.settlement.id}",
          description: "差异金额: #{sprintf("%.2f", @discrepancy.difference_amount)}元\n#{comment || '无备注'}",
          priority: :urgent,
          status: :pending,
          due_date: 1.day.from_now.to_date
        )
      end

      NotificationWorker.perform_async(@current_user.id, 'discrepancy_escalated')

      @discrepancy
    end
  rescue StandardError => e
    Rails.logger.error "Escalate discrepancy failed for discrepancy #{@discrepancy.id}: #{e.message}"
    raise e
  end

  def supplement_material(description, file_url = nil)
    ActiveRecord::Base.transaction do
      material = @discrepancy.supplement_materials.create!(
        uploader: @current_user,
        description:,
        file_url:
      )

      @discrepancy.todo_items.incomplete.each do |todo|
        TodoItem.create!(
          settlement: @discrepancy.settlement,
          discrepancy: @discrepancy,
          assignee: todo.assignee,
          assigner: @current_user,
          title: "差异已补充材料 - 结算单 #{@discrepancy.settlement.id}",
          description: "材料描述: #{description}",
          priority: :high,
          status: :pending,
          due_date: 2.days.from_now.to_date
        )
      end

      material
    end
  rescue StandardError => e
    Rails.logger.error "Supplement material failed for discrepancy #{@discrepancy.id}: #{e.message}"
    raise e
  end

  private

  def complete_discrepancy_todos(comment)
    @discrepancy.todo_items.incomplete.each do |todo|
      todo.update!(
        status: :completed,
        completed_at: Time.current,
        completion_note: comment
      )
    end
  end
end
