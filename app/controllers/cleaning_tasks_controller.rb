class CleaningTasksController < ApplicationController
  before_action :set_cleaning_task, only: [:show, :edit, :update, :destroy]

  def index
    @cleaning_tasks = CleaningTask.all
  end

  def show
  end

  def new
    @cleaning_task = CleaningTask.new
  end

  def create
    @cleaning_task = CleaningTask.new(cleaning_task_params)

    if @cleaning_task.save
      redirect_to @cleaning_task, notice: "Cleaning task was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @cleaning_task.update(cleaning_task_params)
      redirect_to @cleaning_task, notice: "Cleaning task was successfully updated.", status: :see_other
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @cleaning_task.destroy
    redirect_to cleaning_tasks_url, notice: "Cleaning task was successfully destroyed.", status: :see_other
  end

  private

  def set_cleaning_task
    @cleaning_task = CleaningTask.find(params[:id])
  end

  def cleaning_task_params
    params.require(:cleaning_task).permit(:property_id, :task_date, :status, :assignee_id, :priority, :note)
  end
end
