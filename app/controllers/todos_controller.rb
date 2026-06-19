class TodosController < ApplicationController
  before_action :set_todo, only: [:show, :edit, :update, :destroy, :start, :complete, :cancel]

  def index
    @q = current_user.assigned_todos.ransack(params[:q])
    @todos = @q.result.by_due_date.page(params[:page]).per(20)
  end

  def show
  end

  def new
    @todo = Todo.new
  end

  def edit
  end

  def create
    @todo = Todo.new(todo_params)
    @todo.creator = current_user

    if @todo.save
      redirect_to @todo, notice: "待办创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @todo.update(todo_params)
      redirect_to @todo, notice: "待办更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @todo.destroy
    redirect_to todos_url, notice: "待办已删除。", status: :see_other
  end

  def start
    if @todo.may_start?
      @todo.in_progress!
      redirect_to @todo, notice: "待办已开始。"
    else
      redirect_to @todo, alert: "无法开始此待办。"
    end
  end

  def complete
    if @todo.may_complete?
      @todo.completed!
      redirect_to @todo, notice: "待办已完成。"
    else
      redirect_to @todo, alert: "无法完成此待办。"
    end
  end

  def cancel
    if @todo.may_cancel?
      @todo.cancelled!
      redirect_to @todo, notice: "待办已取消。"
    else
      redirect_to @todo, alert: "无法取消此待办。"
    end
  end

  private

  def set_todo
    @todo = current_user.assigned_todos.find(params[:id])
  end

  def todo_params
    params.require(:todo).permit(:title, :description, :assignee_id, :status, :priority, :due_date, :source_type, :source_id)
  end
end
