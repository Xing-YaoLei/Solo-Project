class PermissionConfig < ApplicationRecord
  include Searchable

  belongs_to :supplier
  belongs_to :granted_by, class_name: "User", optional: true

  has_paper_trail only: [:permission_type, :access_scope, :is_active]

  validates :permission_type, presence: true, length: { maximum: 50 }
  validates :access_scope, presence: true

  store_attribute :access_scope, :departments, :string, array: true, default: []
  store_attribute :access_scope, :systems, :string, array: true, default: []
  store_attribute :access_scope, :data_range, :string, default: "own"
  store_attribute :access_scope, :features, :string, array: true, default: []
  store_attribute :access_scope, :expires_at, :datetime

  scope :active, -> { where(is_active: true) }
  scope :inactive, -> { where(is_active: false) }
  scope :by_type, ->(type) { where(permission_type: type) }

  PERMISSION_TYPES = %w[
    data_access
    audit_participation
    document_upload
    report_view
    exception_handling
    approval
  ].freeze

  DATA_RANGES = %w[own department all].freeze

  def self.permission_type_options
    PERMISSION_TYPES.map { |type| [I18n.t("permission_configs.types.#{type}", default: type.humanize), type] }
  end

  def self.data_range_options
    DATA_RANGES.map { |range| [I18n.t("permission_configs.data_ranges.#{range}", default: range.humanize), range] }
  end

  def expired?
    access_scope["expires_at"].present? && access_scope["expires_at"].to_datetime <= DateTime.now
  end

  def status_text
    if !is_active?
      :inactive
    elsif expired?
      :expired
    else
      :active
    end
  end

  def has_feature?(feature)
    features.include?(feature.to_s)
  end

  def can_access_department?(dept)
    data_range == "all" || departments.include?(dept.to_s)
  end
end
