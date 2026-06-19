class Order < ApplicationRecord
  belongs_to :package
  belongs_to :channel
  belongs_to :staff, class_name: "User", optional: true

  has_many :check_in_records, dependent: :destroy
  has_many :redemption_records, dependent: :destroy
  has_many :oversell_communications, dependent: :destroy
  has_many :oversell_reviews, dependent: :destroy

  enum :status, { pending: "pending",
                 confirmed: "confirmed",
                 checked_in: "checked_in",
                 completed: "completed",
                 cancelled: "cancelled" }

  validates :order_number, :customer_name, :quantity, :unit_price, :total_amount, presence: true
  validates :order_number, uniqueness: true
  validates :quantity, numericality: { only_integer: true, greater_than: 0 }
  validates :unit_price, :total_amount, numericality: { greater_than_or_equal_to: 0 }

  before_validation :generate_order_number, on: :create
  before_validation :calculate_total_amount

  scope :oversold, -> { where(is_oversold: true) }
  scope :not_oversold, -> { where(is_oversold: false) }
  scope :by_staff, ->(staff_id) { where(staff_id: staff_id) }
  scope :upcoming_check_ins, -> { where("check_in_date >= ?", Date.today).order(:check_in_date) }
  scope :for_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }

  def confirm!
    return false unless pending?

    ActiveRecord::Base.transaction do
      if package.available_inventory >= quantity
        package.decrease_inventory(quantity)
        update!(status: :confirmed, confirmed_at: Time.current)
      else
        update!(status: :confirmed, is_oversold: true, confirmed_at: Time.current)
      end
    end
  end

  def cancel!
    return false unless pending? || confirmed?

    ActiveRecord::Base.transaction do
      if confirmed? && package.available_inventory < package.total_inventory
        package.increase_inventory(quantity)
      end
      update!(status: :cancelled, cancelled_at: Time.current)
    end
  end

  def check_in!
    return false unless confirmed?

    update!(status: :checked_in)
  end

  def complete!
    return false unless checked_in?

    update!(status: :completed)
  end

  def days_stay
    return 0 unless check_in_date && check_out_date

    (check_out_date - check_in_date).to_i
  end

  private

  def generate_order_number
    return if order_number.present?

    loop do
      self.order_number = "ORD#{Time.current.strftime('%Y%m%d')}#{SecureRandom.rand(1000..9999)}"
      break unless Order.exists?(order_number: order_number)
    end
  end

  def calculate_total_amount
    self.total_amount = (unit_price * quantity).round(2) if unit_price && quantity
  end
end
