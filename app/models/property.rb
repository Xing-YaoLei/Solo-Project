class Property < ApplicationRecord
  STATUSES = %w[active inactive maintenance].freeze

  belongs_to :manager, class_name: "User"
  has_many :room_statuses, dependent: :destroy
  has_many :channel_orders, dependent: :destroy
  has_many :cleaning_tasks, dependent: :destroy
  has_many :room_conflicts, dependent: :destroy
  has_many :monthly_reports, dependent: :destroy

  validates :name, presence: true
  validates :address, presence: true
  validates :room_count, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  scope :active, -> { where(status: "active") }

  def status_i18n
    I18n.t("property_statuses.#{status}", default: status)
  end

  def status_on(date)
    room_statuses.find_by(status_date: date)
  end

  def orders_between(start_date, end_date)
    channel_orders.where("check_in <= ? AND check_out >= ?", end_date, start_date)
  end

  def cleaning_tasks_on(date)
    cleaning_tasks.where(task_date: date)
  end

  def calculate_occupancy(month)
    start_date = month.beginning_of_month
    end_date = month.end_of_month
    total_nights = room_count * (end_date - start_date + 1).to_i
    occupied_nights = 0

    orders = orders_between(start_date, end_date)
    orders.each do |order|
      order_start = [order.check_in, start_date].max
      order_end = [order.check_out - 1.day, end_date].min
      occupied_nights += (order_end - order_start + 1).to_i if order_end >= order_start
    end

    total_nights > 0 ? (occupied_nights.to_d / total_nights * 100).round(2) : 0
  end
end
