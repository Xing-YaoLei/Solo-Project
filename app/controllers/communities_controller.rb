class CommunitiesController < ApplicationController
  before_action :set_community, only: [:show, :edit, :update, :destroy]

  def index
    @communities = Community.all
    @communities = @communities.where(status: params[:status]) if params[:status].present?
    @communities = @communities.where(manager_id: params[:manager_id]) if params[:manager_id].present?
    @communities = @communities.includes(:manager, :students).order(created_at: :desc).page(params[:page]).per(20)
    @users = User.all
  end

  def show
    @students = @community.students.includes(:member_profile).order(created_at: :desc).page(params[:page]).per(20)
    @exams = @community.exams.order(exam_date: :desc).limit(10)
    @assignments = @community.assignments.order(due_date: :desc).limit(10)
  end

  def new
    @community = Community.new
    @users = User.all
  end

  def create
    @community = Community.new(community_params)
    if @community.save
      log_operation("create", target: @community, details: "创建社群：#{@community.name}")
      redirect_to @community, notice: "社群创建成功"
    else
      @users = User.all
      render :new
    end
  end

  def edit
    @users = User.all
  end

  def update
    before_data = @community.attributes.slice("name", "course_name", "status", "manager_id", "start_date", "end_date")
    if @community.update(community_params)
      after_data = @community.attributes.slice("name", "course_name", "status", "manager_id", "start_date", "end_date")
      log_operation("update", target: @community, before_data: before_data, after_data: after_data, details: "更新社群信息")
      redirect_to @community, notice: "社群更新成功"
    else
      @users = User.all
      render :edit
    end
  end

  def destroy
    log_operation("delete", target: @community, details: "删除社群：#{@community.name}")
    @community.destroy
    redirect_to communities_path, notice: "社群已删除"
  end

  private

  def set_community
    @community = Community.find(params[:id])
  end

  def community_params
    params.require(:community).permit(
      :name, :course_name, :description, :status, :manager_id,
      :start_date, :end_date
    )
  end
end
