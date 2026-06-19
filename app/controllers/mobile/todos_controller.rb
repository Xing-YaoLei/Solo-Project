class Mobile::TodosController < ApplicationController
  layout "mobile"

  def index
    @q = current_user.assigned_todos.ransack(params[:q])
    @todos = @q.result.by_due_date.page(params[:page]).per(10)
    @pending_count = current_user.assigned_todos.pending.count
    @in_progress_count = current_user.assigned_todos.in_progress.count
    @today_count = current_user.assigned_todos.due_today.count
  end

  def show
    @todo = current_user.assigned_todos.find(params[:id])
  end
end
