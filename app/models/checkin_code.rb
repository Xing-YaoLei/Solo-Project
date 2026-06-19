class CheckinCode < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :ticket
  has_one :performance, through: :ticket

  validates :code, presence: true, uniqueness: true

  enum :status, { active: "active", verified: "verified", used: "used", expired: "expired" }, default: :active

  aasm column: :status, enum: true do
    state :active, initial: true
    state :verified
    state :used
    state :expired

    event :verify do
      transitions from: :active, to: :verified, after: :record_verified
    end

    event :use do
      transitions from: %i[active verified], to: :used, after: [:record_used, :checkin_ticket]
    end

    event :expire do
      transitions from: :active, to: :expired, guard: :expired?
    end
  end

  def self.export_scope_description
    "关联票号与演出名称，按签到码状态筛选"
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  private

  def record_verified
    update_column(:verified_at, Time.current)
  end

  def record_used
    update_column(:used_at, Time.current)
  end

  def checkin_ticket
    ticket.checkin! if ticket.may_checkin?
  end
end
