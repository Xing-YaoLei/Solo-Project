class ConflictNotificationJob < ApplicationJob
  queue_as :default

  def perform(conflict_id)
    conflict = RoomConflict.find_by(id: conflict_id)
    return unless conflict

    property = conflict.property
    manager = property&.manager
    handlers = User.where(role: %w[admin manager]).to_a
    handlers << manager if manager

    handlers.uniq.each do |handler|
      Rails.logger.info "=== 推送房态冲突消息 ==="
      Rails.logger.info "  接收人: #{handler.name} (#{handler.role})"
      Rails.logger.info "  房源: #{property.name}"
      Rails.logger.info "  冲突日期: #{conflict.conflict_date}"
      Rails.logger.info "  冲突原因: #{conflict.reason}"
      Rails.logger.info "  创建时间: #{conflict.created_at}"
      Rails.logger.info "========================="

      conflict.update!(handler: handler) unless conflict.handler_id
    end
  end
end
