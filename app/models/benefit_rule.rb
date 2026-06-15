class BenefitRule < ApplicationRecord
  has_paper_trail

  RULE_TYPES = %w[discount gift points service].freeze
  MEMBER_LEVELS = %w[all basic premium vip].freeze

  belongs_to :creator, class_name: "User", optional: true
  has_many :redemption_records, dependent: :nullify

  validates :name, presence: true
  validates :rule_type, inclusion: { in: RULE_TYPES }
  validates :target_member_level, inclusion: { in: MEMBER_LEVELS }

  scope :active, -> { where(is_active: true).where("effective_date <= ? AND (expiry_date IS NULL OR expiry_date >= ?)", Date.current, Date.current) }
  scope :by_type, ->(type) { where(rule_type: type) if type.present? }
  scope :for_level, ->(level) { where(target_member_level: [level, "all"]) if level.present? }

  def currently_active?
    is_active && effective_date <= Date.current && (expiry_date.nil? || expiry_date >= Date.current)
  end

  def version_history
    versions.order(created_at: :desc)
  end
end
