class ConflictNotificationJob < ApplicationJob
  self.queue_adapter = :sidekiq
  queue_as :default
  sidekiq_options retry: 3

  def perform(conflict_id)
    conflict = RoomConflict.find_by(id: conflict_id)
    return unless conflict

    property = conflict.property
    manager = property&.manager
    handlers = User.where(role: %w[admin manager]).to_a
    handlers << manager if manager
    handlers = handlers.compact.uniq

    assigned_handler = if conflict.handler_id.nil?
                         manager || handlers.find { |h| h.role == "manager" } || handlers.first
                       else
                         conflict.handler
                       end

    if assigned_handler && conflict.handler_id.nil?
      conflict.update!(handler: assigned_handler)
      conflict.conflict_actions.create!(
        action: "自动分配处理人",
        actor: assigned_handler,
        note: "系统检测到冲突，自动分配给 #{assigned_handler.name} 处理"
      )
    end

    handlers.each do |handler|
      Rails.logger.info "=== 推送房态冲突消息 ==="
      Rails.logger.info "  接收人: #{handler.name} (#{handler.role})"
      Rails.logger.info "  房源: #{property.name}"
      Rails.logger.info "  冲突日期: #{conflict.conflict_date}"
      Rails.logger.info "  冲突原因: #{conflict.reason}"
      Rails.logger.info "  分配处理人: #{assigned_handler&.name || '未分配'}"
      Rails.logger.info "  创建时间: #{conflict.created_at}"
      Rails.logger.info "========================="
    end
  end
end
