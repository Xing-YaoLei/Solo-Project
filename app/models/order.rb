class Order < ApplicationRecord
  include AASM

  enum :status, { pending: 0, paid: 1, cancelled: 2, refunded: 3, partially_refunded: 4 }
  enum :pay_method, { wechat: 0, alipay: 1, bank_transfer: 2, cash: 3 }

  belongs_to :user
  belongs_to :course
  belongs_to :channel
  has_many :enrollments
  has_many :settlement_items, dependent: :nullify
  has_many :channel_commissions, dependent: :destroy

  validates :order_no, presence: true, uniqueness: true
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true
  validates :user_id, presence: true
  validates :course_id, presence: true
  validates :channel_id, presence: true

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :paid
    state :cancelled
    state :refunded
    state :partially_refunded

    event :pay do
      transitions from: :pending, to: :paid
    end

    event :cancel do
      transitions from: :pending, to: :cancelled
    end

    event :refund do
      transitions from: :paid, to: :refunded
    end

    event :partial_refund do
      transitions from: :paid, to: :partially_refunded
    end
  end

  before_validation :generate_order_no, on: :create

  def commission_amount
    return 0.to_d unless paid? || partially_refunded?
    channel.commission_amount_for(amount)
  end

  def net_revenue
    return 0.to_d unless paid?
    amount.to_d - commission_amount.to_d
  end

  private

  def generate_order_no
    return if order_no.present?
    self.order_no = "ORD#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(4).upcase}"
  end
end
