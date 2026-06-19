class User < ApplicationRecord
  ROLES = %w[admin manager cleaner staff].freeze

  has_many :managed_properties, class_name: "Property", foreign_key: "manager_id"
  has_many :assigned_tasks, class_name: "CleaningTask", foreign_key: "assignee_id"
  has_many :handled_conflicts, class_name: "RoomConflict", foreign_key: "handler_id"
  has_many :conflict_actions, class_name: "ConflictAction", foreign_key: "actor_id"
  has_many :document_change_logs, class_name: "DocumentChangeLog", foreign_key: "operator_id"
  has_many :report_downloads, class_name: "ReportDownload", foreign_key: "reporter_id"

  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }

  def display_name
    "#{name} (#{role_i18n})"
  end

  def role_i18n
    I18n.t("roles.#{role}", default: role)
  end

  ROLES.each do |role_name|
    define_method "#{role_name}?" do
      self.role == role_name
    end
  end
end
