class Quote < ApplicationRecord
  STATUSES = %w[draft sent approved rejected expired].freeze

  belongs_to :work_order
  belongs_to :approved_by, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :quote_items, dependent: :destroy

  enum :status, STATUSES.zip(STATUSES).to_h

  before_validation :generate_quote_no, on: :create
  before_save :calculate_total

  def calculate_total
    self.total_amount = quote_items.sum(&:subtotal)
  end

  private

  def generate_quote_no
    date_str = Time.current.strftime('%Y%m%d')
    last_quote = Quote.where('quote_no LIKE ?', "QT#{date_str}%").order(quote_no: :desc).first
    sequence = last_quote ? last_quote.quote_no[-4..].to_i + 1 : 1
    self.quote_no = "QT#{date_str}#{format('%04d', sequence)}"
  end
end
