class TicketOrder < ApplicationRecord
  belongs_to :event
  belongs_to :ticket_type
  belongs_to :user
  has_one :check_in_record, dependent: :destroy
  has_many :refund_disputes, dependent: :destroy

  has_paper_trail only: %i[status quantity total_amount ticket_type_id buyer_name buyer_email buyer_phone remark]

  validates :order_no, presence: true, uniqueness: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: %w[pending paid cancelled refunded checked_in] }

  before_validation :generate_order_no, on: :create

  scope :paid, -> { where(status: "paid") }
  scope :checked_in, -> { where(status: "checked_in") }
  scope :by_event, ->(event_id) { where(event_id: event_id) }

  def checked_in?
    status == "checked_in"
  end

  def can_check_in?
    status == "paid"
  end

  def can_refund?
    status.in?(%w[paid checked_in])
  end

  def version_changes
    versions.map do |v|
      {
        version: v,
        changeset: v.changeset,
        operator: v.whodunnit.present? ? User.find_by(id: v.whodunnit) : nil,
        created_at: v.created_at
      }
    end
  end

  private

  def generate_order_no
    return if order_no.present?
    loop do
      self.order_no = "ORD-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}"
      break unless TicketOrder.exists?(order_no: order_no)
    end
  end
end
