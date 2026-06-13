class PickupOrder < ApplicationRecord
  include AASM

  STATUS_DISPLAY = {
    'pending' => '待提交',
    'submitted' => '已提交',
    'processing' => '处理中',
    'materials_missing' => '缺材料',
    'reviewing' => '复核中',
    'completed' => '已完成',
    'closed' => '已关闭'
  }.freeze

  SUB_STATUS_DISPLAY = {
    'normal' => '正常',
    'has_shortage' => '有短少',
    'needs_proof' => '需补充凭证',
    'review_pending' => '待复核',
    'review_rejected' => '复核退回'
  }.freeze

  SOURCES = %w[美团优选 多多买菜 橙心优选 淘菜菜 其他].freeze

  belongs_to :operator, class_name: 'User', optional: true
  belongs_to :reviewer, class_name: 'User', optional: true
  has_many :pickup_items, dependent: :destroy
  has_many :after_sales_proofs, dependent: :destroy
  has_many :shortage_records, dependent: :destroy
  has_many :activity_logs, dependent: :destroy

  accepts_nested_attributes_for :pickup_items, allow_destroy: true
  accepts_nested_attributes_for :after_sales_proofs, allow_destroy: true
  accepts_nested_attributes_for :shortage_records, allow_destroy: true

  validates :pickup_code, presence: true, uniqueness: true
  validates :customer_name, presence: true
  validates :source, presence: true, inclusion: { in: SOURCES }
  validates :estimated_pickup_time, presence: true

  scope :active, -> { where.not(status: 'closed') }
  scope :closed, -> { where(status: 'closed') }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_source, ->(source) { where(source: source) if source.present? }
  scope :by_operator, ->(operator_id) { where(operator_id: operator_id) if operator_id.present? }
  scope :date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) if start_date && end_date }
  scope :with_shortage, -> { where(has_shortage: true) }

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "customer_name", "customer_phone", "has_shortage", "id", "operator_id", "pickup_code", "reviewer_id", "source", "status", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["activity_logs", "after_sales_proofs", "operator", "pickup_items", "reviewer", "shortage_records"]
  end

  aasm column: 'status' do
    state :pending, initial: true
    state :submitted
    state :processing
    state :materials_missing
    state :reviewing
    state :completed
    state :closed

    event :submit do
      transitions from: :pending, to: :submitted, after: :after_submit
    end

    event :start_process do
      transitions from: :submitted, to: :processing, after: :after_start_process
    end

    event :mark_missing_materials do
      transitions from: :processing, to: :materials_missing, after: :after_mark_missing
    end

    event :materials_received do
      transitions from: :materials_missing, to: :processing, after: :after_materials_received
    end

    event :send_to_review do
      transitions from: :processing, to: :reviewing, after: :after_send_to_review
    end

    event :complete do
      transitions from: :reviewing, to: :completed, after: :after_complete
    end

    event :reject_review do
      transitions from: :reviewing, to: :processing, after: :after_reject_review
    end

    event :close do
      transitions from: [:completed, :closed], to: :closed, after: :after_close
    end
  end

  def on_time?
    return false unless actual_pickup_time && estimated_pickup_time
    actual_pickup_time <= estimated_pickup_time + 30.minutes
  end

  def total_items_count
    pickup_items.sum(:expected_quantity)
  end

  def total_shortage_count
    shortage_records.sum(:shortage_quantity)
  end

  def status_display
    STATUS_DISPLAY[status] || status
  end

  def sub_status_display
    SUB_STATUS_DISPLAY[sub_status] || sub_status
  end

  def full_status_display
    sub_status.present? ? "#{status_display} - #{sub_status_display}" : status_display
  end

  def log_activity(action, user: nil, from_status: nil, to_status: nil, details: nil)
    activity_logs.create!(
      user: user,
      action: action,
      from_status: from_status,
      to_status: to_status,
      details: details
    )
  end

  def calculate_shortage!
    has_shortage = pickup_items.any? { |item| item.shortage_quantity > 0 }
    update!(has_shortage: has_shortage)
  end

  def missing_proofs?
    sub_status == 'needs_proof'
  end

  private

  def after_submit(user: nil)
    update!(submitted_at: Time.current, sub_status: 'normal')
    log_activity('submit', user: user, from_status: 'pending', to_status: 'submitted', details: '单据已提交')
    NotifyUserJob.perform_later(id, 'submitted')
  end

  def after_start_process(user: nil)
    update!(processed_at: Time.current, operator: user)
    log_activity('start_process', user: user, from_status: 'submitted', to_status: 'processing', details: '开始处理')
  end

  def after_mark_missing(user: nil)
    update!(sub_status: 'needs_proof')
    log_activity('mark_missing', user: user, from_status: 'processing', to_status: 'materials_missing', details: '标记缺材料')
    NotifyUserJob.perform_later(id, 'materials_missing')
  end

  def after_materials_received(user: nil)
    update!(sub_status: 'normal')
    log_activity('materials_received', user: user, from_status: 'materials_missing', to_status: 'processing', details: '材料已补充')
  end

  def after_send_to_review(user: nil)
    update!(sub_status: 'review_pending')
    log_activity('send_to_review', user: user, from_status: 'processing', to_status: 'reviewing', details: '提交复核')
  end

  def after_complete(user: nil)
    update!(reviewed_at: Time.current, reviewer: user, actual_pickup_time: Time.current)
    log_activity('complete', user: user, from_status: 'reviewing', to_status: 'completed', details: '复核通过，已完成')
    DailySummaryJob.perform_later(created_at.to_date)
  end

  def after_reject_review(user: nil, reason: nil)
    update!(sub_status: 'review_rejected')
    log_activity('reject_review', user: user, from_status: 'reviewing', to_status: 'processing', details: "复核退回: #{reason}")
  end

  def after_close(user: nil)
    update!(closed_at: Time.current)
    log_activity('close', user: user, from_status: status_was, to_status: 'closed', details: '单据已关闭')
  end
end
