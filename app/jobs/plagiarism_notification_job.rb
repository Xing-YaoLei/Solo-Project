class PlagiarismNotificationJob < ApplicationJob
  queue_as :mailers

  def perform(plagiarism_log_id)
    log = PlagiarismLog.find_by(id: plagiarism_log_id)
    return unless log
    return unless log.responsible_user

    Rails.logger.info "[抄袭提醒] 发送给负责人 #{log.responsible_user.name} (ID: #{log.responsible_user.id})"
    Rails.logger.info "[抄袭提醒] 学员: #{log.student.name}, 相似度: #{log.similarity_score}%"
    Rails.logger.info "[抄袭提醒] 原因: #{log.reason}"
    Rails.logger.info "[抄袭提醒] 作业ID: #{log.assignment_submission&.id}"

    send_in_app_notification(log)

    OperationLog.log!(
      "notify",
      operator: log.responsible_user,
      target: log,
      reason: "抄袭检测系统自动提醒",
      details: "向 #{log.responsible_user.name} 发送抄袭提醒：学员 #{log.student.name} 的作业相似率 #{log.similarity_score}%"
    )
  rescue => e
    Rails.logger.error "PlagiarismNotificationJob failed for log #{plagiarism_log_id}: #{e.message}"
    raise e
  end

  private

  def send_in_app_notification(log)
    # 这里可以集成实际的消息推送、邮件或短信通知
    # 暂时使用日志记录
    notification = {
      type: "plagiarism_alert",
      user_id: log.responsible_user_id,
      plagiarism_log_id: log.id,
      student_name: log.student&.name,
      similarity_score: log.similarity_score,
      reason: log.reason,
      created_at: Time.current.iso8601
    }
    Rails.logger.info "[站内通知] #{notification.to_json}"
  end
end
