class NotificationWorker
  include Sidekiq::Worker

  sidekiq_options queue: :notification, retry: 3, backtrace: true

  NOTIFICATION_TYPES = {
    settlement_approved: "结算单已审批通过",
    settlement_rejected: "结算单已被驳回",
    discrepancy_resolved: "差异已解决",
    discrepancy_escalated: "差异已升级处理",
    todo_assigned: "您有新的待办任务",
    todo_reassigned: "待办已重新分派给您",
    todo_rejected: "您的待办被驳回",
    todo_completed: "待办已完成",
    todo_cancelled: "待办已取消",
    amount_adjusted: "结算金额已调整",
    batch_settlement_summary: "批量结算完成汇总",
    report_ready: "报表已生成",
    payment_reminder: "付款提醒",
    data_sync_completed: "数据同步完成",
    data_sync_failed: "数据同步失败",
    payment_scheduled: "回款计划已生成"
  }.freeze

  def perform(user_id, notification_type, *args)
    @user = User.find_by(id: user_id)
    @notification_type = notification_type.to_sym
    @args = args

    return unless @user
    return unless NOTIFICATION_TYPES.key?(@notification_type)

    Rails.logger.info "Sending notification #{@notification_type} to user #{@user.id}"

    send_in_app_notification
    send_sms_notification if should_send_sms?

    { success: true }
  rescue StandardError => e
    Rails.logger.error "Notification sending failed for user #{user_id}, type #{notification_type}: #{e.message}"
    { success: false, error: e.message }
  end

  private

  def send_in_app_notification
    title = NOTIFICATION_TYPES[@notification_type]
    content = build_notification_content

    @user.todo_items.create!(
      title:,
      description: content,
      priority: notification_priority,
      status: :pending,
      due_date: 3.business_days.from_now,
      notification_type: @notification_type
    )

    Rails.logger.info "In-app notification created for user #{@user.id}: #{title}"
  end

  def send_sms_notification
    return unless @user.phone

    message = build_sms_message

    begin
      sms_provider.send_sms(@user.phone, message)
      Rails.logger.info "SMS notification sent to #{@user.phone}: #{@notification_type}"
    rescue StandardError => e
      Rails.logger.error "SMS sending failed to #{@user.phone}: #{e.message}"
    end
  end

  def build_notification_content
    case @notification_type
    when :settlement_approved
      settlement = Settlement.find_by(id: @args[0])
      if settlement
        "您的结算单 #{settlement.id}（#{settlement.period}）已审批通过，金额 #{sprintf("%.2f", settlement.system_amount)} 元"
      else
        "您的结算单已审批通过"
      end
    when :settlement_rejected
      settlement = Settlement.find_by(id: @args[0])
      if settlement
        "您的结算单 #{settlement.id}（#{settlement.period}）已被驳回，请及时处理"
      else
        "您的结算单已被驳回"
      end
    when :todo_assigned, :todo_reassigned
      todo = TodoItem.find_by(id: @args[0])
      todo ? "待办：#{todo.title}" : "您有新的待办任务需要处理"
    when :batch_settlement_summary
      period, success, failed, skipped = @args
      "#{period} 批量结算完成：成功 #{success} 笔，失败 #{failed} 笔，跳过 #{skipped} 笔"
    when :report_ready
      report_type, file_path = @args
      "报表已生成：#{report_type}，文件路径：#{file_path}"
    when :payment_reminder
      settlement = Settlement.find_by(id: @args[0])
      if settlement
        "付款提醒：结算单 #{settlement.id}（#{settlement.period}）将于 #{settlement.payment_date} 付款，金额 #{sprintf("%.2f", settlement.system_amount)} 元"
      else
        "您有待处理的付款提醒"
      end
    else
      NOTIFICATION_TYPES[@notification_type]
    end
  end

  def build_sms_message
    "[管理系统] #{build_notification_content}"
  end

  def notification_priority
    case @notification_type
    when :settlement_rejected, :todo_rejected, :discrepancy_escalated
      :urgent
    when :settlement_approved, :todo_assigned, :todo_reassigned, :payment_reminder
      :high
    else
      :medium
    end
  end

  def should_send_sms?
    sms_notification_types = %i[
      settlement_approved settlement_rejected
      discrepancy_escalated todo_assigned
      payment_reminder data_sync_failed
    ]

    sms_notification_types.include?(@notification_type) && @user.role != :merchant
  end

  def sms_provider
    @sms_provider ||= SmsProvider.new
  end
end

class SmsProvider
  def send_sms(phone, message)
    Rails.logger.info "[SMS Provider] To: #{phone}, Message: #{message}"
    true
  end
end
