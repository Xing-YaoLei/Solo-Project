class ReviewTagsController < ApplicationController
  before_action :set_course_consumption

  def create
    review_tag = ReviewTag.find_or_create_by!(name: params[:review_tag][:name])
    unless @course_consumption.review_tags.include?(review_tag)
      @course_consumption.review_tags << review_tag
    end
    redirect_to @course_consumption
  end

  def destroy
    review_tag = ReviewTag.find(params[:id])
    @course_consumption.review_tags.delete(review_tag)
    redirect_to @course_consumption
  end

  private

  def set_course_consumption
    @course_consumption = CourseConsumption.find(params[:course_consumption_id])
  end
end
