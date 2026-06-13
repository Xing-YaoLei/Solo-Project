class PerformanceFeedbacksController < ApplicationController
  before_action :set_course_consumption
  before_action :set_performance_feedback, only: [:update, :destroy]

  def create
    @performance_feedback = @course_consumption.performance_feedbacks.build(performance_feedback_params)
    if @performance_feedback.save
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "成绩反馈创建失败"
    end
  end

  def update
    if @performance_feedback.update(performance_feedback_params)
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "成绩反馈更新失败"
    end
  end

  def destroy
    @performance_feedback.destroy
    respond_to do |format|
      format.html { redirect_to @course_consumption }
      format.turbo_stream
    end
  end

  private

  def set_course_consumption
    @course_consumption = CourseConsumption.find(params[:course_consumption_id])
  end

  def set_performance_feedback
    @performance_feedback = @course_consumption.performance_feedbacks.find(params[:id])
  end

  def performance_feedback_params
    params.require(:performance_feedback).permit(:course_chapter_id, :score, :performance_level,
                                                  :coach_feedback, :member_feedback, :improvement_points,
                                                  :body_metrics)
  end
end
