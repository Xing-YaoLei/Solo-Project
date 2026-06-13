class CourseConsumption < ApplicationRecord
  include AASM

  belongs_to :member
  belongs_to :trainer
  belongs_to :course_package

  has_many :course_chapters, -> { ordered }, dependent: :destroy, inverse_of: :course_consumption
  has_many :performance_feedbacks, dependent: :destroy, inverse_of: :course_consumption
  has_many :reminder_rules, dependent: :destroy, inverse_of: :course_consumption
  has_many :course_consumption_review_tags, dependent: :destroy
  has_many :review_tags, through: :course_consumption_review_tags
  has_many :settlement_events, -> { chronological }, dependent: :destroy

  accepts_nested_attributes_for :course_chapters, allow_destroy: true
  accepts_nested_attributes_for :performance_feedbacks, allow_destroy: true
  accepts_nested_attributes_for :reminder_rules, allow_destroy: true

  validates :bill_no, presence: true, uniqueness: true
  validates :consumption_date, presence: true
  validates :sessions_consumed, numericality: { greater_than: 0 }

  SOURCE_CHANNELS = %w[offline_promotion online_referral friend_referral corporate_cooperation other].freeze
  PROCESSING_STATUSES = %w[normal needs_more_info escalated completed].freeze

  aasm column: :status do
    state :draft, initial: true
    state :pending_review
    state :reviewing
    state :approved
    state :rejected
    state :processing
    state :needs_more_info
    state :escalated
    state :settled
    state :reviewed
    state :closed

    event :submit_for_review do
      transitions from: :draft, to: :pending_review, after: :log_submit_event
    end

    event :start_review do
      transitions from: :pending_review, to: :reviewing, after: :log_review_start_event
    end

    event :approve do
      transitions from: [:pending_review, :reviewing, :needs_more_info, :escalated], to: :approved, after: :log_approve_event
    end

    event :reject do
      transitions from: [:pending_review, :reviewing, :needs_more_info, :escalated], to: :rejected, after: :log_reject_event
    end

    event :process_settlement do
      transitions from: :approved, to: :processing, after: :log_processing_event
    end

    event :request_more_info do
      transitions from: [:processing, :reviewing], to: :needs_more_info, after: :log_info_request_event
    end

    event :escalate do
      transitions from: [:processing, :needs_more_info], to: :escalated, after: :log_escalate_event
    end

    event :complete do
      transitions from: [:processing, :escalated], to: :settled, after: :log_settle_event
    end

    event :review_after_settlement do
      transitions from: :settled, to: :reviewed, after: :log_review_event
    end

    event :close do
      transitions from: [:rejected, :reviewed, :settled], to: :closed, after: :log_close_event
    end
  end

  def update_progress_rate!
    return if course_chapters.empty?
    completed = course_chapters.where(chapter_status: "completed").count
    total = course_chapters.count
    self.progress_rate = ((completed.to_f / total) * 100).round(2)
    save!
  end

  def behind_schedule?
    return false if progress_rate >= 80
    days_elapsed = (Date.today - consumption_date).to_i
    return false if days_elapsed < 7
    true
  end

  def processing_status_label
    {
      "normal" => "正常",
      "needs_more_info" => "补资料",
      "escalated" => "升级复核",
      "completed" => "完成"
    }.fetch(processing_status, processing_status)
  end

  def status_label
    {
      "draft" => "草稿",
      "pending_review" => "待审核",
      "reviewing" => "审核中",
      "approved" => "已通过",
      "rejected" => "已拒绝",
      "processing" => "处理中",
      "needs_more_info" => "待补资料",
      "escalated" => "升级复核",
      "settled" => "已结算",
      "reviewed" => "已复盘",
      "closed" => "已关闭"
    }.fetch(status, status)
  end

  def self.dashboard_stats
    {
      total: count,
      draft: where(status: :draft).count,
      pending_review: where(status: :pending_review).count,
      processing: where(status: :processing).count,
      needs_more_info: where(processing_status: :needs_more_info).count,
      escalated: where(processing_status: :escalated).count,
      settled: where(status: :settled).count,
      reviewed: where(status: :reviewed).count,
      closed: where(status: :closed).count,
      behind_schedule: all.select(&:behind_schedule?).count
    }
  end

  def self.completion_rate_by_period(start_date, end_date)
    where(consumption_date: start_date..end_date)
      .group_by_day(:consumption_date)
      .count
  end

  def self.by_source_channel
    where.not(source_channel: nil)
      .group(:source_channel)
      .count
      .sort_by { |_, v| -v }
  end

  def self.by_responsible_person
    where.not(responsible_person: nil)
      .group(:responsible_person)
      .count
      .sort_by { |_, v| -v }
  end

  def self.by_review_tag
    joins(:review_tags)
      .group("review_tags.name")
      .count
      .sort_by { |_, v| -v }
  end

  private

  def log_submit_event
    settlement_events.create!(event_type: "submitted", from_status: "draft", to_status: "pending_review", operator: "system")
  end

  def log_review_start_event
    settlement_events.create!(event_type: "status_changed", from_status: "pending_review", to_status: "reviewing")
  end

  def log_approve_event
    self.processing_status = "normal"
    self.reviewed_at = Time.current
    settlement_events.create!(event_type: "approved", to_status: "approved")
  end

  def log_reject_event
    settlement_events.create!(event_type: "rejected", to_status: "rejected")
  end

  def log_processing_event
    settlement_events.create!(event_type: "status_changed", from_status: "approved", to_status: "processing")
  end

  def log_info_request_event
    self.processing_status = "needs_more_info"
    settlement_events.create!(event_type: "processing_info_requested", to_status: "needs_more_info")
  end

  def log_escalate_event
    self.processing_status = "escalated"
    settlement_events.create!(event_type: "escalated", to_status: "escalated")
  end

  def log_settle_event
    self.processing_status = "completed"
    self.settled_at = Time.current
    settlement_events.create!(event_type: "settled", to_status: "settled")
  end

  def log_review_event
    settlement_events.create!(event_type: "reviewed", to_status: "reviewed")
  end

  def log_close_event
    self.is_closed = true
    self.closed_at = Time.current
    settlement_events.create!(event_type: "closed", to_status: "closed")
  end
end
