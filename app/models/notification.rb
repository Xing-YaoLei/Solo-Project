class Notification < ApplicationRecord
  include Searchable

  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :user_id, presence: true
  validates :notification_type, presence: true, length: { maximum: 50 }
  validates :title, presence: true, length: { maximum: 200 }

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :recent, -> { order(created_at: :desc) }
  scope :latest, ->(limit = 20) { recent.limit(limit) }
  scope :created_between, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }

  NOTIFICATION_TYPES = %w[
    audit_status_changed
    exception_created
    exception_assigned
    exception_resolved
    exception_overdue
    evidence_missing
    export_completed
    export_failed
    material_expiring
    system_announcement
  ].freeze

  def self.notification_type_options
    NOTIFICATION_TYPES.map do |type|
      [I18n.t("notification_types.#{type}", default: type.humanize), type]
    end
  end

  def unread?
    !read?
  end

  def mark_as_read!
    return if read?
    update!(read: true, read_at: Time.current)
  end

  def mark_as_unread!
    update!(read: false, read_at: nil)
  end

  def self.mark_all_as_read(user)
    where(user_id: user.id, read: false).update_all(read: true, read_at: Time.current)
  end

  def notification_type_color
    case notification_type
    when /exception/ then "red"
    when /failed/ then "red"
    when /overdue/ then "orange"
    when /completed|resolved/ then "green"
    when /changed|created|assigned/ then "blue"
    when /expiring/ then "yellow"
    else "gray"
    end
  end

  def icon
    case notification_type
    when /exception/ then "alert-triangle"
    when /evidence/ then "file-x"
    when /export/ then "download"
    when /material/ then "clock"
    when /status/ then "refresh-cw"
    when /assigned/ then "user-plus"
    when /resolved|completed/ then "check-circle"
    when /overdue/ then "alert-octagon"
    when /system/ then "info"
    else "bell"
    end
  end

  def time_ago
    I18n.l(created_at, format: :short)
  end

  def full_timestamp
    I18n.l(created_at, format: :long)
  end

  def self.create_for_users(users, params)
    Array(users).each do |user|
      create!(params.merge(user: user))
    end
  end

  def self.notify_audit_status_change(audit, operator)
    users = User.supervisors.active + [audit.creator]
    users.uniq.each do |user|
      create!(
        user: user,
        notifiable: audit,
        notification_type: "audit_status_changed",
        title: "审计项目状态变更",
        content: "#{operator.name} 将审计项目「#{audit.title}」状态变更为 #{audit.status_text}"
      )
    end
  end

  def self.notify_exception_created(exception, creator)
    handlers = User.supervisors.active
    handlers.each do |user|
      create!(
        user: user,
        notifiable: exception,
        notification_type: "exception_created",
        title: "新异常单创建",
        content: "#{creator.name} 创建了异常单「#{exception.title}」，请及时处理"
      )
    end
  end

  def self.notify_exception_assigned(exception, assignor)
    return unless exception.handler.present?
    create!(
      user: exception.handler,
      notifiable: exception,
      notification_type: "exception_assigned",
      title: "异常单分派通知",
      content: "#{assignor.name} 将异常单「#{exception.title}」分派给您处理"
    )
  end

  def self.notify_export_completed(export_record)
    create!(
      user: export_record.user,
      notifiable: export_record,
      notification_type: "export_completed",
      title: "导出完成",
      content: "您的导出任务「#{export_record.export_type_text}」已完成，可以下载了"
    )
  end

  def self.notify_export_failed(export_record, error_message)
    create!(
      user: export_record.user,
      notifiable: export_record,
      notification_type: "export_failed",
      title: "导出失败",
      content: "您的导出任务失败：#{error_message}"
    )
  end

  def export_type_text
    I18n.t("export_types.#{export_type}", default: export_type.to_s.humanize) if respond_to?(:export_type)
  end
end
