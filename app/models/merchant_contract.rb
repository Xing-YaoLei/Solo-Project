class MerchantContract < ApplicationRecord
  enum :status, { pending: 0, active: 1, expired: 2, terminated: 3 }, default: :pending

  has_many :processing_records, as: :recordable
  has_many :todos, as: :source
  has_many :secondary_consumptions, dependent: :destroy

  validates :merchant_name, presence: true
  validates :contract_number, presence: true, uniqueness: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validate :end_date_after_start_date

  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :expiring_soon, -> { where(end_date: 30.days.from_now..60.days.from_now) }
  scope :active, -> { where(status: :active) }

  monetize :amount_cents, allow_nil: true

  def self.ransackable_attributes(auth_object = nil)
    %w[amount_cents category commission_rate contact_person contact_phone contract_number created_at end_date id merchant_name shop_location start_date status terms updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[processing_records secondary_consumptions todos]
  end

  def total_consumption_amount
    secondary_consumptions.sum(:amount_cents)
  end

  def commission_amount
    return 0 if commission_rate.blank?

    (total_consumption_amount * commission_rate / 100).to_i
  end

  private

  def end_date_after_start_date
    return if end_date.blank? || start_date.blank?

    errors.add(:end_date, "must be after start date") if end_date <= start_date
  end
end
