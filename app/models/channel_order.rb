class ChannelOrder < ApplicationRecord
  CHANNELS = %w[airbnb booking meituan xiaohongshu direct other].freeze
  STATUSES = %w[pending confirmed checked_in checked_out cancelled no_show].freeze

  belongs_to :property
  belongs_to :guest
  has_many :check_in_documents, dependent: :destroy

  validates :order_no, presence: true, uniqueness: true
  validates :check_in, presence: true
  validates :check_out, presence: true
  validates :channel, inclusion: { in: CHANNELS }
  validates :status, inclusion: { in: STATUSES }
  validates :price, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  validate :check_out_after_check_in

  scope :for_date_range, ->(start_date, end_date) { where("check_in <= ? AND check_out >= ?", end_date, start_date) }
  scope :for_property, ->(property_id) { where(property_id: property_id) }
  scope :active, -> { where(status: %w[pending confirmed checked_in]) }

  after_commit :detect_conflicts_on_save, on: [:create, :update]
  after_commit :update_room_statuses, on: [:create, :update]
  after_commit :schedule_cleaning, on: [:create, :update]

  def nights
    (check_out - check_in).to_i
  end

  def total_price
    (price || 0) * nights
  end

  def channel_i18n
    I18n.t("channels.#{channel}", default: channel)
  end

  def status_i18n
    I18n.t("order_statuses.#{status}", default: status)
  end

  def status_color
    case status
    when "pending" then "bg-yellow-100 text-yellow-800"
    when "confirmed" then "bg-blue-100 text-blue-800"
    when "checked_in" then "bg-green-100 text-green-800"
    when "checked_out" then "bg-gray-100 text-gray-800"
    when "cancelled" then "bg-red-100 text-red-800"
    when "no_show" then "bg-orange-100 text-orange-800"
    else "bg-gray-100 text-gray-800"
    end
  end

  private

  def check_out_after_check_in
    return unless check_in && check_out
    errors.add(:check_out, "必须晚于入住日期") if check_out <= check_in
  end

  def detect_conflicts_on_save
    return unless %w[confirmed checked_in].include?(status)

    trigger_fields = %w[status property_id check_in check_out]
    has_trigger_change = trigger_fields.any? { |f| previous_changes.key?(f) }

    return unless has_trigger_change

    ConflictDetectionJob.perform_later(id)
  end

  def update_room_statuses
    RoomStatusUpdateJob.perform_later(property_id, check_in.to_s, check_out.to_s)
  end

  def schedule_cleaning
    return unless %w[checked_out].include?(status) && saved_change_to_status?
    CleaningScheduleJob.perform_later(property_id, check_out.to_s)
  end
end
