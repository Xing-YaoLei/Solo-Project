class AssignmentsController < ApplicationController
  before_action :set_assignment, only: [:show, :edit, :update, :destroy]

  def index
    @assignments = Assignment.all
    @assignments = @assignments.by_community(params[:community_id])
    @assignments = @assignments.includes(:community, :creator).order(due_date: :desc).page(params[:page]).per(20)
  end

  def show
    @submissions = @assignment.assignment_submissions.includes(:student, :reviewer).order(submitted_at: :desc)
    @flagged_submissions = @submissions.select { |s| s.plagiarism_flagged? }
  end

  def new
    @assignment = Assignment.new
    @communities = Community.all
    @users = User.all
  end

  def create
    @assignment = Assignment.new(assignment_params)
    @assignment.creator = current_user
    if @assignment.save
      log_operation("create", target: @assignment, details: "创建作业：#{@assignment.title}")
      redirect_to @assignment, notice: "作业创建成功"
    else
      @communities = Community.all
      @users = User.all
      render :new
    end
  end

  def edit
    @communities = Community.all
    @users = User.all
  end

  def update
    before_data = @assignment.attributes.slice("title", "community_id", "due_date", "total_score", "enable_plagiarism_check", "plagiarism_threshold")
    if @assignment.update(assignment_params)
      after_data = @assignment.attributes.slice("title", "community_id", "due_date", "total_score", "enable_plagiarism_check", "plagiarism_threshold")
      log_operation("update", target: @assignment, before_data: before_data, after_data: after_data, details: "更新作业信息")
      redirect_to @assignment, notice: "作业更新成功"
    else
      @communities = Community.all
      @users = User.all
      render :edit
    end
  end

  def destroy
    log_operation("delete", target: @assignment, details: "删除作业：#{@assignment.title}")
    @assignment.destroy
    redirect_to assignments_path, notice: "作业已删除"
  end

  private

  def set_assignment
    @assignment = Assignment.find(params[:id])
  end

  def assignment_params
    params.require(:assignment).permit(
      :title, :community_id, :description, :due_date,
      :total_score, :enable_plagiarism_check, :plagiarism_threshold, :requirements
    )
  end
end
