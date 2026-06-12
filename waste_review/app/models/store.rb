class Store < ApplicationRecord
  has_many :waste_reports, dependent: :destroy
  has_many :cost_entries, foreign_key: :responsible_store_id, dependent: :nullify
  has_many :abnormal_reports, through: :waste_reports

  validates :name, presence: true, uniqueness: true
  validates :code, presence: true, uniqueness: true
  validates :monthly_purchase, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :active, -> { where(active: true) }
  scope :by_region, ->(region) { where(region: region) if region.present? }

  def monthly_waste_cost(date = Date.current)
    waste_reports.where(report_date: date.all_month).sum(:total_cost)
  end

  def monthly_waste_rate(date = Date.current)
    purchase = monthly_purchase || 100_000.0
    return 0.0 unless purchase.positive?

    (monthly_waste_cost(date) / purchase * 100).round(2)
  end

  def waste_rate_trend(months = 6)
    (0...months).map do |i|
      date = i.months.ago.to_date
      {
        month: date.strftime("%Y-%m"),
        rate: monthly_waste_rate(date),
        cost: monthly_waste_cost(date)
      }
    end.reverse
  end
end
