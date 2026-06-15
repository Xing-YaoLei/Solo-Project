class EnrollmentsController < ApplicationController
  before_action :set_enrollment, only: [:show, :edit, :update, :start_learning, :complete]

  def index
    scope = Enrollment.includes(:user, :course, :channel)

    if params[:status].present?
      scope = scope.where(status: params[:status])
    end

    if params[:behind_schedule].present?
      scope = scope.select(&:behind_schedule?)
    end

    if params[:user_id].present?
      scope = scope.where(user_id: params[:user_id])
    end

    if params[:course_id].present?
      scope = scope.where(course_id: params[:course_id])
    end

    @enrollments = scope.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @lesson_progresses = @enrollment.lesson_progresses.includes(:lesson).order("lessons.position")
    @exam_records = @enrollment.exam_records.order(created_at: :desc)
    @follow_ups = @enrollment.follow_ups.order(created_at: :desc)
    @appeals = @enrollment.appeals.order(created_at: :desc)
    @qa_threads = @enrollment.qa_threads.order(created_at: :desc)
  end

  def new
    @enrollment = Enrollment.new
  end

  def create
    @enrollment = Enrollment.new(enrollment_params)
    @enrollment.enrolled_at = Time.current
    @enrollment.expired_at = 90.days.from_now
    @enrollment.status = :enrolled

    if @enrollment.save
      redirect_to @enrollment, notice: "报名已创建"
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @enrollment.update(enrollment_params)
      redirect_to @enrollment, notice: "报名已更新"
    else
      render :edit
    end
  end

  def start_learning
    @enrollment.start_learning!
    redirect_to @enrollment, notice: "已开始学习"
  end

  def complete
    @enrollment.update_progress!
    redirect_to @enrollment, notice: "进度已更新"
  end

  private

  def set_enrollment
    @enrollment = Enrollment.find(params[:id])
  end

  def enrollment_params
    params.require(:enrollment).permit(:user_id, :course_id, :channel_id, :order_id, :status, :expired_at)
  end
end
