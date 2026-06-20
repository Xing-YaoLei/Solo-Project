class CheckInRecord < ApplicationRecord
  belongs_to :ticket_order
  belongs_to :ticket_type
  belongs_to :event
  belongs_to :operator, class_name: "User"

  validates :check_in_time, presence: true
  validates :check_in_method, presence: true, inclusion: { in: %w[qr_code manual nfc] }
  validates :ticket_order_id, uniqueness: { message: I18n.t("check_in_record.already_checked_in") }

  scope :today, -> { where(check_in_time: Time.current.all_day) }
  scope :by_event, ->(event_id) { where(event_id: event_id) }
  scope :by_date_range, ->(start_date, end_date) { where(check_in_time: start_date..end_date) }
  scope :recent, -> { order(check_in_time: :desc) }

  after_create :mark_order_checked_in
  after_create :broadcast_check_in_update

  private

  def mark_order_checked_in
    ticket_order.update!(status: "checked_in")
  end

  def broadcast_check_in_update
    Turbo::StreamsChannel.broadcast_replace_to(
      [event, :check_in_records],
      target: "check_in_stats",
      partial: "check_in_records/stats",
      locals: { event: event }
    )
  end
end
