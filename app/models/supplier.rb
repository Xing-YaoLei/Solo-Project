class Supplier < ApplicationRecord
  include Searchable

  extend Enumerize
  enumerize :status, in: %i[active inactive suspended], default: :active, predicates: true

  belongs_to :created_by, class_name: "User", optional: true
  has_many :materials, class_name: "SupplierMaterial", dependent: :destroy
  has_many :permission_configs, dependent: :destroy
  has_many :audits, dependent: :destroy

  accepts_nested_attributes_for :materials,
    allow_destroy: true,
    reject_if: ->(attrs) { attrs[:name].blank? && attrs[:material_type].blank? }

  accepts_nested_attributes_for :permission_configs,
    allow_destroy: true,
    reject_if: ->(attrs) { attrs[:permission_type].blank? }

  has_paper_trail only: [:name, :code, :contact_person, :phone, :email, :status, :description]

  validates :name, presence: true, length: { maximum: 200 }
  validates :code, presence: true, length: { maximum: 50 }, uniqueness: true
  validates :email, length: { maximum: 100 }, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :phone, length: { maximum: 50 }, allow_blank: true
  validates :contact_person, length: { maximum: 100 }, allow_blank: true

  scope :active, -> { where(status: :active) }
  scope :search_by_name_or_code, ->(keyword) { where("name ILIKE ? OR code ILIKE ?", "%#{keyword}%", "%#{keyword}%") }

  def latest_audit
    audits.order(created_at: :desc).first
  end

  def audit_history
    audits.order(created_at: :desc).limit(10)
  end

  def material_completeness
    return 0 if materials.count.zero?
    (materials.approved.count.to_f / materials.count * 100).round(1)
  end

  def pending_materials_count
    materials.where(status: :pending).count
  end

  def expired_materials_count
    materials.where("expire_at <= ? AND status = ?", Date.today, :approved).count
  end

  def has_active_permissions?
    permission_configs.where(is_active: true).exists?
  end
end
