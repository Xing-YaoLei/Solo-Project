class CoursePackagesController < ApplicationController
  before_action :set_course_package, only: [:show, :edit, :update]

  def index
    @q = CoursePackage.ransack(params[:q])
    @course_packages = @q.result.order(created_at: :desc).page(params[:page])
  end

  def show; end

  def new
    @course_package = CoursePackage.new
  end

  def edit; end

  def create
    @course_package = CoursePackage.new(course_package_params)
    if @course_package.save
      redirect_to @course_package, notice: "课程包已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @course_package.update(course_package_params)
      redirect_to @course_package, notice: "课程包已更新"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_course_package
    @course_package = CoursePackage.find(params[:id])
  end

  def course_package_params
    params.require(:course_package).permit(:name, :package_type, :total_sessions, :price,
                                            :validity_days, :description)
  end
end
