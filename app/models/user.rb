class User < ApplicationRecord
  include Searchable

  devise :database_authenticatable, :registerable, :recoverable,
         :rememberable, :validatable, :trackable, :lockable, :confirmable

  extend Enumerize
  enumerize :role, in: %i[auditor supervisor admin], default: :auditor, predicates: true

  has_many :created_suppliers, class_name: "Supplier", foreign_key: :created_by_id, dependent: :nullify
  has_many :uploaded_materials, class_name: "SupplierMaterial", foreign_key: :uploaded_by_id, dependent: :nullify
  has_many :created_audits, class_name: "Audit", foreign_key: :creator_id, dependent: :nullify
  has_many :uploaded_evidence, class_name: "EvidenceAttachment", foreign_key: :uploader_id, dependent: :nullify
  has_many :handled_exceptions, class_name: "ExceptionOrder", foreign_key: :handler_id, dependent: :nullify
  has_many :created_templates, class_name: "NotificationTemplate", foreign_key: :creator_id, dependent: :nullify
  has_many :granted_permissions, class_name: "PermissionConfig", foreign_key: :granted_by_id, dependent: :nullify
  has_many :checked_items, class_name: "ChecklistItem", foreign_key: :checked_by_id, dependent: :nullify
  has_many :state_transition_logs, foreign_key: :operator_id, dependent: :nullify
  has_many :export_records, dependent: :destroy
  has_many :notifications, dependent: :destroy

  has_paper_trail only: [:name, :email, :role]

  validates :name, presence: true, length: { maximum: 100 }
  validates :email, presence: true, length: { maximum: 100 }, format: { with: URI::MailTo::EMAIL_REGEXP }

  scope :auditors, -> { where(role: :auditor) }
  scope :supervisors, -> { where(role: :supervisor) }
  scope :admins, -> { where(role: :admin) }
  scope :active, -> { where(locked_at: nil) }

  def can_manage_suppliers?
    auditor? || supervisor? || admin?
  end

  def can_approve_audits?
    supervisor? || admin?
  end

  def can_manage_system?
    admin?
  end

  def unread_notifications_count
    notifications.where(read: false).count
  end

  private

  def password_required?
    !persisted? || !password.nil? || !password_confirmation.nil?
  end
end
