class FollowUpGenerationJob < ApplicationJob
  queue_as :default

  def perform
    behind_enrollments = Enrollment.where(status: [:enrolled, :studying])
                                    .where("enrolled_at < ?", 7.days.ago)
                                    .select(&:behind_schedule?)

    behind_enrollments.each do |enrollment|
      next if enrollment.follow_ups.pending.exists?
      next if enrollment.follow_ups.where("created_at > ?", 3.days.ago).exists?

      assistant = find_assistant_for(enrollment)
      next unless assistant

      FollowUp.create!(
        enrollment: enrollment,
        assistant: assistant,
        reason: determine_reason(enrollment),
        description: "学员进度落后，需要跟进。当前进度：#{enrollment.progress}%",
        next_follow_up_at: 1.day.from_now,
        status: :pending
      )
    end
  end

  private

  def find_assistant_for(enrollment)
    User.assistant.order("RANDOM()").first
  end

  def determine_reason(enrollment)
    if enrollment.completed_lessons_count.to_i == 0
      "未开始学习"
    elsif enrollment.progress.to_i < 30
      "进度严重落后"
    else
      "进度落后"
    end
  end
end
