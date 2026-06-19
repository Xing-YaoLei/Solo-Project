class Performance < ApplicationRecord
  include AASM
  include StatusLoggable
  include Exportable

  has_many :ticket_types, dependent: :destroy
  has_many :seats, dependent: :destroy
  has_many :sponsorships, dependent: :destroy
  has_many :sponsors, through: :sponsorships
  has_many :tickets, through: :ticket_types

  validates :name, presence: true, length: { maximum: 200 }
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :venue, presence: true
  validates :total_seats, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validate :end_time_after_start_time

  enum :status, { draft: "draft", published: "published", ongoing: "ongoing", finished: "finished", cancelled: "cancelled" }, default: :draft

  aasm column: :status, enum: true do
    state :draft, initial: true
    state :published
    state :ongoing
    state :finished
    state :cancelled

    event :publish do
      transitions from: :draft, to: :published
    end

    event :start do
      transitions from: :published, to: :ongoing
    end

    event :finish do
      transitions from: :ongoing, to: :finished
    end

    event :cancel do
      transitions from: %i[draft published], to: :cancelled
    end
  end

  def self.export_scope_description
    "按演出状态筛选，默认全部"
  end

  def seat_map_data
    seats.group_by(&:section).transform_values do |section_seats|
      section_seats.group_by(&:row).transform_values(&:sort_by)
    end
  end

  def available_seats
    seats.where(status: :available)
  end

  def occupied_seats
    seats.where(status: :occupied)
  end

  def occupancy_rate
    return 0 if seats.count.zero?
    occupied_seats.count.to_f / seats.count * 100
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time
    errors.add(:end_time, "必须晚于开始时间") if end_time <= start_time
  end
end
