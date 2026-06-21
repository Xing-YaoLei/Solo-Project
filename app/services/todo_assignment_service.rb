class TodoAssignmentService
  def initialize(current_user)
    @current_user = current_user
  end

  def assign_todo(assignee, params)
    ActiveRecord::Base.transaction do
      todo = TodoItem.new(params)
      todo.assigner = @current_user
      todo.assignee = assignee
      todo.status ||= :pending
      todo.priority ||= :medium
      todo.due_date ||= 3.business_days.from_now
      todo.save!

      NotificationWorker.perform_async(assignee.id, :todo_assigned, todo.id)

      todo
    end
  rescue StandardError => e
    Rails.logger.error "Assign todo failed: #{e.message}"
    raise e
  end

  def batch_reassign(todo_ids, new_assignee, comment = nil)
    ActiveRecord::Base.transaction do
      todos = TodoItem.where(id: todo_ids).incomplete
      raise "No incomplete todos found" if todos.empty?

      todos.each do |todo|
        old_assignee = todo.assignee
        todo.update!(
          assignee: new_assignee,
          assigner: @current_user,
          reassigned_at: Time.current,
          reassigned_count: (todo.reassigned_count || 0) + 1
        )

        TodoItem.create!(
          settlement: todo.settlement,
          discrepancy: todo.discrepancy,
          assignee: new_assignee,
          assigner: @current_user,
          title: "待办重新分派 - #{todo.title}",
          description: "原处理人: #{old_assignee.name}\n#{comment || '无备注'}",
          priority: todo.priority,
          status: :pending,
          due_date: todo.due_date || 2.business_days.from_now,
          parent_id: todo.id
        )

        NotificationWorker.perform_async(new_assignee.id, :todo_reassigned, todo.id)
      end

      todos
    end
  rescue StandardError => e
    Rails.logger.error "Batch reassign failed: #{e.message}"
    raise e
  end

  def reject_and_resubmit(todo, reject_reason, new_due_date = nil)
    ActiveRecord::Base.transaction do
      raise "Todo is not in progress" unless todo.in_progress?
      raise "Reject reason required" if reject_reason.blank?

      todo.update!(
        status: :pending,
        rejected_at: Time.current,
        reject_reason:,
        rejected_by: @current_user.id,
        due_date: new_due_date || 3.business_days.from_now
      )

      TodoItem.create!(
        settlement: todo.settlement,
        discrepancy: todo.discrepancy,
        assignee: todo.assignee,
        assigner: @current_user,
        title: "待办被驳回需重提 - #{todo.title}",
        description: "驳回原因: #{reject_reason}",
        priority: :urgent,
        status: :pending,
        due_date: new_due_date || 3.business_days.from_now,
        parent_id: todo.id
      )

      NotificationWorker.perform_async(todo.assignee.id, :todo_rejected, todo.id)

      todo
    end
  rescue StandardError => e
    Rails.logger.error "Reject and resubmit failed for todo #{todo&.id}: #{e.message}"
    raise e
  end

  def complete_todo(todo, completion_note = nil)
    ActiveRecord::Base.transaction do
      todo.update!(
        status: :completed,
        completed_at: Time.current,
        completed_by: @current_user.id,
        completion_note:
      )

      NotificationWorker.perform_async(todo.assigner.id, :todo_completed, todo.id) if todo.assigner

      todo
    end
  rescue StandardError => e
    Rails.logger.error "Complete todo failed for todo #{todo&.id}: #{e.message}"
    raise e
  end

  def cancel_todo(todo, cancel_reason = nil)
    ActiveRecord::Base.transaction do
      todo.update!(
        status: :cancelled,
        cancelled_at: Time.current,
        cancelled_by: @current_user.id,
        cancel_reason:
      )

      NotificationWorker.perform_async(todo.assignee.id, :todo_cancelled, todo.id)

      todo
    end
  rescue StandardError => e
    Rails.logger.error "Cancel todo failed for todo #{todo&.id}: #{e.message}"
    raise e
  end
end
