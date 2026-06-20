class Ticket < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :order
  belongs_to :ticket_type
  belongs_to :seat
  has_one :checkin_code, dependent: :destroy
  has_one :performance, through: :ticket_type

  validates :ticket_no, presence: true, uniqueness: true

  enum :status, { reserved: "reserved", issued: "issued", checked_in: "checked_in", cancelled: "cancelled", expired: "expired" }, default: :reserved

  aasm column: :status, enum: true do
    state :reserved, initial: true
    state :issued
    state :checked_in
    state :cancelled
    state :expired

    event :issue do
      transitions from: :reserved, to: :issued
    end

    event :checkin do
      transitions from: :issued, to: :checked_in, after: :stamp_checkin_time
    end

    event :cancel do
      transitions from: %i[reserved issued], to: :cancelled, after: :release_seat
    end

    event :expire do
      transitions from: :reserved, to: :expired
    end
  end

  before_validation :generate_ticket_no, on: :create
  after_create :assign_seat

  def self.export_scope_description
    "关联订单号、票种名称、座位号，按票状态筛选"
  end

  def generate_checkin_code!
    return if checkin_code.present?

    code = SecureRandom.hex(8).upcase
    create_checkin_code!(
      code: code,
      qr_code_data: { ticket_no: ticket_no, code: code, performance: performance&.name }.to_json,
      status: :active,
      expires_at: performance&.end_time
    )
  end

  private

  def generate_ticket_no
    self.ticket_no ||= "TKT#{Time.current.strftime('%Y%m%d%H%M')}#{SecureRandom.hex(3).upcase}"
  end

  def stamp_checkin_time
    update_column(:checked_in_at, Time.current)
  end

  def release_seat
    seat&.update(status: :available)
  end

  def assign_seat
    seat&.update(status: :occupied) if seat&.available?
  end
end
