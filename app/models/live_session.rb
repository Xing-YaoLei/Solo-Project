class LiveSession < ApplicationRecord
  enum :status, { upcoming: 0, live: 1, ended: 2, cancelled: 3 }

  belongs_to :course

  validates :title, presence: true
  validates :start_time, presence: true
  validates :end_time, presence: true
  validate :end_time_after_start_time

  def end_time_after_start_time
    return if end_time.blank? || start_time.blank?
    errors.add(:end_time, "必须晚于开始时间") if end_time <= start_time
  end

  def live_now?
    status == "live"
  end

  def has_playback?
    playback_url.present? && ended?
  end
end
