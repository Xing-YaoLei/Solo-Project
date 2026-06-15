class ChannelCommission < ApplicationRecord
  enum :status, { pending: 0, settled: 1, paid: 2, cancelled: 3 }

  belongs_to :channel
  belongs_to :order
  belongs_to :settlement, optional: true

  validates :channel_id, presence: true
  validates :order_id, presence: true
  validates :commission_rate, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }
  validates :commission_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :for_channel, ->(channel_id) { where(channel_id: channel_id) }
  scope :for_period, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :settled, -> { where(status: :settled) }
  scope :paid, -> { where(status: :paid) }
end
