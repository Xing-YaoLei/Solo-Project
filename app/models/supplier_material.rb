class SupplierMaterial < ApplicationRecord
  include Searchable

  extend Enumerize
  enumerize :status, in: %i[pending approved expired rejected], default: :pending, predicates: true

  belongs_to :supplier
  belongs_to :uploaded_by, class_name: "User", optional: true

  has_paper_trail only: [:material_type, :name, :status, :expire_at, :remark]

  validates :material_type, presence: true, length: { maximum: 50 }
  validates :name, presence: true, length: { maximum: 200 }

  scope :by_type, ->(type) { where(material_type: type) }
  scope :expiring_soon, ->(days = 30) { where("expire_at BETWEEN ? AND ? AND status = ?", Date.today, days.days.from_now, :approved) }
  scope :expired, -> { where("expire_at <= ? AND status = ?", Date.today, :approved) }
  scope :approved, -> { where(status: :approved) }
  scope :pending, -> { where(status: :pending) }
  scope :rejected, -> { where(status: :rejected) }

  MATERIAL_TYPES = %w[
    business_license
    tax_certificate
    quality_certification
    safety_certification
    insurance_certificate
    financial_statement
    contract
    other
  ].freeze

  def self.material_type_options
    MATERIAL_TYPES.map { |type| [I18n.t("supplier_materials.types.#{type}", default: type.humanize), type] }
  end

  def expire_soon?
    expire_at.present? && expire_at <= 30.days.from_now && expire_at > Date.today && approved?
  end

  def expire_warning_level
    return :normal unless expire_at.present? && approved?
    if expire_at <= Date.today
      :expired
    elsif expire_at <= 7.days.from_now
      :critical
    elsif expire_at <= 30.days.from_now
      :warning
    else
      :normal
    end
  end
end
