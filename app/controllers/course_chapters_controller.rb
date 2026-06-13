class CourseChaptersController < ApplicationController
  before_action :set_course_consumption
  before_action :set_course_chapter, only: [:update, :destroy]

  def create
    @course_chapter = @course_consumption.course_chapters.build(course_chapter_params)
    if @course_chapter.save
      @course_consumption.update_progress_rate!
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "章节创建失败"
    end
  end

  def update
    if @course_chapter.update(course_chapter_params)
      @course_consumption.update_progress_rate!
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "章节更新失败"
    end
  end

  def destroy
    @course_chapter.destroy
    @course_consumption.update_progress_rate!
    respond_to do |format|
      format.html { redirect_to @course_consumption }
      format.turbo_stream
    end
  end

  private

  def set_course_consumption
    @course_consumption = CourseConsumption.find(params[:course_consumption_id])
  end

  def set_course_chapter
    @course_chapter = @course_consumption.course_chapters.find(params[:id])
  end

  def course_chapter_params
    params.require(:course_chapter).permit(:title, :content, :position, :chapter_status)
  end
end
