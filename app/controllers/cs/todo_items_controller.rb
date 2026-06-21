module Cs
  class TodoItemsController < BaseController
    before_action :set_todo_item, only: [ :update ]

    def index
      authorize TodoItem, :index?

      @q = policy_scope(TodoItem).ransack(params[:q])
      @todo_items = @q.result.includes(:assignee, :assigner, :settlement, :discrepancy)
                       .ordered_by_priority.page(params[:page])

      @pending_count = policy_scope(TodoItem).pending.count
      @in_progress_count = policy_scope(TodoItem).in_progress.count
      @completed_count = policy_scope(TodoItem).completed.count
      @overdue_count = policy_scope(TodoItem).overdue.count
    end

    def update
      authorize @todo_item, :update?

      if @todo_item.update(todo_item_params)
        redirect_to cs_todo_items_path, notice: "待办事项已更新。"
      else
        render :index
      end
    end

    def batch_reassign
      authorize TodoItem, :batch_reassign?

      new_assignee = User.find(params[:new_assignee_id])
      todo_item_ids = params[:todo_item_ids]

      TodoItem.transaction do
        TodoItem.where(id: todo_item_ids).each do |todo_item|
          todo_item.update!(assignee: new_assignee)
        end
      end

      redirect_to cs_todo_items_path, notice: "已成功重新分配 #{todo_item_ids.size} 个待办事项。"
    rescue ActiveRecord::RecordInvalid
      redirect_to cs_todo_items_path, alert: "批量重新分配失败，请重试。"
    end

    private

    def set_todo_item
      @todo_item = policy_scope(TodoItem).find(params[:id])
    end

    def todo_item_params
      params.require(:todo_item).permit(policy(TodoItem).permitted_attributes)
    end
  end
end
