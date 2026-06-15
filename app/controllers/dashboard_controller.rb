class DashboardController < ApplicationController
  def index
    @total_students = Student.count
    @active_students = Student.active.count
    @total_communities = Community.count
    @active_communities = Community.active.count

    @today_redemptions = RedemptionRecord.completed.where("redeemed_at >= ?", Date.current.beginning_of_day).count
    @pending_refunds = RefundRecord.where(refund_status: "pending").count
    @open_plagiarism = PlagiarismLog.open.count

    @recent_exams = Exam.order(exam_date: :desc).limit(5)
    @recent_plagiarism = PlagiarismLog.unresolved.order(created_at: :desc).limit(5)
    @recent_operations = OperationLog.recent.limit(10)

    @pass_rate_stats = calculate_pass_rate_stats
    @community_stats = calculate_community_stats
  end

  private

  def calculate_pass_rate_stats
    last_6_months = 6.times.map { |i| i.months.ago.beginning_of_month }
    last_6_months.map do |month|
      start_date = month
      end_date = month.end_of_month
      exams = Exam.where(exam_date: start_date..end_date)
      next { month: month.strftime("%Y-%m"), pass_rate: 0, total: 0 } if exams.empty?

      total_results = exams.joins(:exam_results).count
      passed_results = exams.joins(:exam_results).where(exam_results: { passed: true }).count
      pass_rate = total_results > 0 ? (passed_results.to_f / total_results * 100).round(2) : 0

      { month: month.strftime("%Y-%m"), pass_rate: pass_rate, total: total_results }
    end.reverse
  end

  def calculate_community_stats
    Community.active.includes(:students).limit(6).map do |community|
      {
        name: community.name,
        students: community.students.count,
        active_students: community.students.active.count
      }
    end
  end
end
