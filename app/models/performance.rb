class Performance < ApplicationRecord
  enum :status, { scheduled: 0, ongoing: 1, completed: 2, cancelled: 3 }, default: :scheduled

  has_many :performance_seats, dependent: :destroy
  has_many :processing_records, as: :recordable
  has_many :todos, as: :source
  has_one :performance_cancellation, dependent: :destroy

  validates :name, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validate :end_time_after_start_time

  scope :upcoming, -> { where("start_time > ?", Time.now).order(start_time: :asc) }
  scope :past, -> { where("end_time < ?", Time.now).order(start_time: :desc) }
  scope :by_venue, ->(venue) { where(venue: venue) if venue.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }

  def available_seats_count
    performance_seats.where(status: :available).count
  end

  def sold_seats_count
    performance_seats.where(status: :sold).count
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[created_at description end_time id name poster_image start_time status ticket_price total_seats updated_at venue]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[performance_cancellation performance_seats processing_records todos]
  end

  private

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?

    errors.add(:end_time, "must be after start time") if end_time <= start_time
  end
end
