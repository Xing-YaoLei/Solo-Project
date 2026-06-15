class DashboardController < ApplicationController
  def index
    @total_students = User.where(role: :student).count
    @total_courses = Course.where(status: :published).count
    @total_enrollments = Enrollment.count
    @total_revenue = Order.where(status: :paid).sum(:amount)

    @recent_orders = Order.order(created_at: :desc).limit(10)
    @recent_enrollments = Enrollment.order(created_at: :desc).limit(10)

    @pending_follow_ups = FollowUp.where(status: :pending).count
    @pending_appeals = Appeal.where(status: :pending).count
    @pending_settlements = Settlement.where(status: :pending_review).count

    @behind_schedule_count = Enrollment.where(status: :studying).select(&:behind_schedule?).count
  end
end
