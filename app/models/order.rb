class Order < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  has_many :tickets, dependent: :destroy
  has_many :exception_records, dependent: :nullify
  has_many :checkin_codes, through: :tickets

  validates :order_no, presence: true, uniqueness: true
  validates :customer_name, presence: true, length: { maximum: 100 }
  validates :customer_phone, presence: true, length: { maximum: 20 }
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  enum :status, { pending: "pending", paid: "paid", confirmed: "confirmed", cancelled: "cancelled", refunded: "refunded" }, default: :pending

  enum :payment_method, { cash: "cash", wechat: "wechat", alipay: "alipay", card: "card" }, default: :wechat

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :paid
    state :confirmed
    state :cancelled
    state :refunded

    event :pay do
      transitions from: :pending, to: :paid, after: :record_paid_at
    end

    event :confirm do
      transitions from: :paid, to: :confirmed
    end

    event :cancel do
      transitions from: %i[pending paid], to: :cancelled, after: :release_tickets
    end

    event :refund do
      transitions from: %i[paid confirmed], to: :refunded, after: [:record_refunded_at, :release_tickets, :check_exception]
    end
  end

  before_validation :generate_order_no, on: :create

  def self.export_scope_description
    "按订单状态与支付方式筛选，包含关联票种与演出信息"
  end

  def self.ransackable_attributes(_auth_object = nil)
    %w[order_no customer_name customer_phone status payment_method paid_at refunded_at created_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[tickets]
  end

  def performance
    tickets.first&.ticket_type&.performance
  end

  def create_exception_record!(attrs = {})
    exception_records.create!(
      exception_type: :refund_dispute,
      title: "订单#{order_no}退票争议",
      description: attrs[:description] || "订单#{order_no}发起退票，需要审核",
      impact_scope: attrs[:impact_scope] || "影响#{tickets.count}张票",
      responsible_person: attrs[:responsible_person],
      assignee: attrs[:assignee],
      status: :open
    )
  end

  private

  def generate_order_no
    self.order_no ||= "ORD#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(4).upcase}"
  end

  def record_paid_at
    update_column(:paid_at, Time.current) if paid_at.nil?
  end

  def record_refunded_at
    update_column(:refunded_at, Time.current) if refunded_at.nil?
  end

  def release_tickets
    tickets.each { |t| t.cancel! if t.may_cancel? }
  end

  def check_exception
    return unless tickets.any? { |t| t.checked_in_at.present? }

    ticket = tickets.find { |t| t.checked_in_at.present? }
    exception_records.create!(
      exception_type: :refund_dispute,
      title: "已签到票退票争议-#{order_no}",
      description: "订单#{order_no}包含已签到票，退票需要审核",
      impact_scope: "影响#{tickets.where.not(checked_in_at: nil).count}张已签到票",
      status: :open
    )
  end
end
