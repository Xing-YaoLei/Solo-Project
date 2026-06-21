module Todoable
  extend ActiveSupport::Concern

  included do
    has_many :todo_items, as: :todoable, dependent: :destroy
  end

  def create_todo(assignee, title, options = {})
    todo_items.create!(
      assignee:,
      assigner: options[:assigner],
      title:,
      description: options[:description],
      priority: options[:priority] || :medium,
      status: options[:status] || :pending,
      due_date: options[:due_date] || 3.business_days.from_now
    )
  end

  def create_todos_for_role(role, title, options = {})
    users = User.by_role(role)
    users.map do |user|
      create_todo(user, title, options)
    end
  end

  def pending_todos
    todo_items.by_status(:pending).ordered_by_priority
  end

  def in_progress_todos
    todo_items.by_status(:in_progress).ordered_by_priority
  end

  def completed_todos
    todo_items.by_status(:completed).order(completed_at: :desc)
  end

  def incomplete_todos
    todo_items.incomplete.ordered_by_priority
  end

  def overdue_todos
    todo_items.overdue.ordered_by_priority
  end

  def complete_all_todos(completion_note = nil)
    todo_items.incomplete.each do |todo|
      todo.update!(
        status: :completed,
        completed_at: Time.current,
        completion_note:
      )
    end
  end

  def cancel_all_todos(cancel_reason = nil)
    todo_items.incomplete.each do |todo|
      todo.update!(
        status: :cancelled,
        cancelled_at: Time.current,
        cancel_reason:
      )
    end
  end

  def reassign_todos(new_assignee, options = {})
    todo_items.incomplete.each do |todo|
      todo.update!(
        assignee: new_assignee,
        assigner: options[:assigner],
        reassigned_at: Time.current,
        reassigned_count: (todo.reassigned_count || 0) + 1
      )
    end
  end

  def todo_count_by_status
    todo_items.group(:status).count
  end

  def todo_count_by_priority
    todo_items.group(:priority).count
  end

  def has_pending_todos?
    todo_items.by_status(:pending).exists?
  end

  def has_overdue_todos?
    todo_items.overdue.exists?
  end

  def todos_for_assignee(assignee_id)
    todo_items.by_assignee(assignee_id).ordered_by_priority
  end

  def incomplete_todos_for_assignee(assignee_id)
    todo_items.by_assignee(assignee_id).incomplete.ordered_by_priority
  end
end
