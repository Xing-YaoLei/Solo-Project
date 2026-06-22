class NotificationTemplate < ApplicationRecord
  include Searchable

  belongs_to :creator, class_name: "User"
  has_many :audits, dependent: :nullify

  has_paper_trail only: [:name, :audit_type, :content, :variables, :is_active]

  validates :name, presence: true, length: { maximum: 100 }
  validates :audit_type, presence: true, length: { maximum: 50 }
  validates :content, presence: true

  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
  scope :by_audit_type, ->(type) { where(audit_type: type) }

  store_attribute :variables, :supplier_name, :boolean, default: true
  store_attribute :variables, :audit_title, :boolean, default: true
  store_attribute :variables, :audit_type_var, :boolean, default: true
  store_attribute :variables, :deadline, :boolean, default: false
  store_attribute :variables, :handler, :boolean, default: false
  store_attribute :variables, :custom_fields, :json, default: {}

  AUDIT_TYPES = %w[
    routine_audit
    special_audit
    compliance_audit
    quality_audit
    safety_audit
    financial_audit
  ].freeze

  def self.audit_type_options
    AUDIT_TYPES.map { |type| [I18n.t("audit_types.#{type}", default: type.humanize), type] }
  end

  def render(variables = {})
    content.gsub(/\{\{(\w+)\}\}/) do |_match|
      key = Regexp.last_match(1).to_sym
      variables[key] || variables[key.to_s] || "{{#{key}}}"
    end
  end

  def available_variables
    vars = []
    vars << :supplier_name if supplier_name
    vars << :audit_title if audit_title
    vars << :audit_type if audit_type_var
    vars << :deadline if deadline
    vars << :handler if handler
    vars + custom_fields.keys.map(&:to_sym)
  end

  def variable_count
    available_variables.count
  end
end
