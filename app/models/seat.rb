class Seat < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  belongs_to :performance
  has_many :tickets, dependent: :nullify

  validates :row, presence: true, length: { maximum: 10 }
  validates :seat_number, presence: true, length: { maximum: 10 }
  validates :section, presence: true, length: { maximum: 50 }
  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  enum :status, { available: "available", occupied: "occupied", disabled: "disabled", reserved: "reserved" }, default: :available

  aasm column: :status, enum: true do
    state :available, initial: true
    state :occupied
    state :disabled
    state :reserved

    event :occupy do
      transitions from: :available, to: :occupied
    end

    event :disable do
      transitions from: :available, to: :disabled
    end

    event :release do
      transitions from: %i[occupied reserved], to: :available
    end

    event :reserve do
      transitions from: :available, to: :reserved
    end
  end

  def self.export_scope_description
    "关联演出名称，按区域/行号/状态筛选"
  end

  def display_name
    "#{section}-#{row}排#{seat_number}号"
  end
end
