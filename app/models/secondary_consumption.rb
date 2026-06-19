class SecondaryConsumption < ApplicationRecord
  belongs_to :merchant_contract, optional: true

  validates :amount_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :transaction_time, presence: true
  validates :transaction_no, uniqueness: true, allow_blank: true

  scope :by_date_range, ->(start_date, end_date) {
    if start_date.present? && end_date.present?
      where(transaction_time: start_date.beginning_of_day..end_date.end_of_day)
    end
  }
  scope :by_source, ->(source) { where(source: source) if source.present? }
  scope :by_merchant, ->(merchant_id) { where(merchant_contract_id: merchant_id) if merchant_id.present? }
  scope :recent, -> { order(transaction_time: :desc) }

  monetize :amount_cents

  def self.ransackable_attributes(auth_object = nil)
    %w[amount_cents created_at customer_count id merchant_contract_id payment_method source source_identifier transaction_no transaction_time updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[merchant_contract]
  end

  def self.total_amount
    sum(:amount_cents)
  end

  def self.total_customers
    sum(:customer_count)
  end

  def self.conversion_rate
    return 0 if total_customers.zero?

    # Simple conversion rate: transactions per customer
    count.to_f / total_customers
  end

  def self.group_by_source
    group(:source).sum(:amount_cents)
  end

  def self.group_by_day(start_date = 30.days.ago, end_date = Date.today)
    by_date_range(start_date, end_date)
      .group("DATE(transaction_time)")
      .sum(:amount_cents)
  end
end
