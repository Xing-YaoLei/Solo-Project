class DailyProgressCheckJob < ApplicationJob
  queue_as :default

  def perform
    check_expiring_enrollments
    check_certificate_eligibility
    auto_complete_lessons
  end

  private

  def check_expiring_enrollments
    expiring = Enrollment.where(status: [:enrolled, :studying])
                         .where(expired_at: 7.days.from_now.all_day)

    expiring.find_each do |enrollment|
      Rails.logger.info "Enrollment #{enrollment.id} will expire in 7 days"
    end
  end

  def check_certificate_eligibility
    completed_courses = Enrollment.completed
                                   .where(exam_passed: true, certificate_issued: false)

    completed_courses.find_each do |enrollment|
      certificate = enrollment.course.certificates.active.first
      next unless certificate

      enrollment.issue_certificate!(certificate)
    end
  end

  def auto_complete_lessons
    LessonProgress.where(status: :in_progress)
                  .where("updated_at < ?", 24.hours.ago)
                  .find_each do |progress|
      if progress.watch_duration.to_i >= (progress.lesson.duration.to_i * 0.8)
        progress.complete!
      end
    end
  end
end
