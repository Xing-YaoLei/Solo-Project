class PlagiarismCheckJob < ApplicationJob
  queue_as :default

  def perform(submission_id)
    submission = AssignmentSubmission.find_by(id: submission_id)
    return unless submission
    return unless submission.content.present?

    assignment = submission.assignment
    return unless assignment&.enable_plagiarism_check

    threshold = assignment.plagiarism_threshold || 30.0
    similar_submissions = find_similar_submissions(submission, threshold)

    if similar_submissions.any?
      flag_submission(submission, similar_submissions, threshold)
    end
  rescue => e
    Rails.logger.error "PlagiarismCheckJob failed for submission #{submission_id}: #{e.message}"
    raise e
  end

  private

  def find_similar_submissions(submission, threshold)
    return [] unless submission.content.length > 20

    AssignmentSubmission
      .where(assignment_id: submission.assignment_id)
      .where.not(id: submission.id)
      .where.not(content: nil)
      .select do |other|
        next false if other.content.to_s.length < 20
        similarity = calculate_similarity(submission.content, other.content)
        similarity >= threshold
      end
  end

  def calculate_similarity(text1, text2)
    words1 = tokenize(text1)
    words2 = tokenize(text2)

    return 0.0 if words1.empty? || words2.empty?

    intersection = (words1 & words2).length
    union = words1.length + words2.length - intersection

    return 0.0 if union.zero?

    (intersection.to_f / union * 100).round(2)
  end

  def tokenize(text)
    text.to_s.downcase.gsub(/[^\p{Han}\w\s]/, "").split(/\s+/).select { |w| w.length > 1 }
  end

  def flag_submission(submission, similar_submissions, threshold)
    highest_similarity = 0.0
    similar_segments = {}
    source_submission_id = nil

    similar_submissions.each do |other|
      similarity = calculate_similarity(submission.content, other.content)
      if similarity > highest_similarity
        highest_similarity = similarity
        source_submission_id = other.id
        similar_segments["source_#{other.id}"] = {
          similarity: similarity,
          source_student_id: other.student_id,
          source_student_name: other.student&.name
        }
      end
    end

    submission.update!(
      plagiarism_score: highest_similarity,
      plagiarism_flagged: true,
      plagiarism_details: {
        threshold: threshold,
        matched_count: similar_submissions.count,
        segments: similar_segments
      }
    )

    responsible_user = determine_responsible_user(submission)

    PlagiarismLog.create!(
      assignment_submission: submission,
      student: submission.student,
      assignment: submission.assignment,
      source_submission_id: source_submission_id,
      similarity_score: highest_similarity,
      reason: "作业相似度 #{highest_similarity}% 超过阈值 #{threshold}%，共检测到 #{similar_submissions.count} 份相似作业",
      similar_segments: similar_segments,
      status: "open",
      responsible_user: responsible_user
    )
  end

  def determine_responsible_user(submission)
    assignment = submission.assignment
    community = assignment&.community
    community&.manager || assignment&.creator
  end
end
