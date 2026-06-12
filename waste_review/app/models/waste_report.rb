class WasteReport < ApplicationRecord
  WASTE_RATE_THRESHOLD = 5.0
  WASTE_RATE_HIGH_THRESHOLD = 10.0
  WASTE_RATE_CRITICAL_THRESHOLD = 20.0

  belongs_to :store
  has_many :waste_items, dependent: :destroy
  has_many :review_opinions, dependent: :destroy
  has_many :cost_entries, dependent: :destroy
  has_many :status_logs, dependent: :destroy
  has_one :abnormal_report, dependent: :destroy

  enum :status, { submitted: 0, reviewing: 1, approved: 2, rejected: 3, settled: 4 }

  accepts_nested_attributes_for :waste_items, allow_destroy: true, reject_if: :all_blank
  accepts_nested_attributes_for :cost_entries, allow_destroy: true, reject_if: :all_blank

  validates :report_date, presence: true
  validates :reporter, presence: true
  validates :status, inclusion: { in: statuses.keys }

  after_save :log_status_change, if: :saved_change_to_status?
  after_save :trigger_anomaly_detection, if: :should_detect_anomaly?
  after_commit :recalculate_totals, on: [:create], unless: :skip_recalculation
  attr_accessor :skip_recalculation

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_store, ->(store_id) { where(store_id: store_id) if store_id.present? }
  scope :by_date_range, ->(start_date, end_date) { where(report_date: start_date..end_date) if start_date && end_date }
  scope :recent, -> { order(report_date: :desc, created_at: :desc) }
  scope :with_abnormal, -> { joins(:abnormal_report) }
  scope :this_month, -> { where(report_date: Date.current.all_month) }

  delegate :name, :region, :monthly_purchase, to: :store, prefix: true

  VALID_TRANSITIONS = {
    'submitted' => %w[reviewing],
    'reviewing' => %w[approved rejected],
    'approved' => %w[settled],
    'rejected' => %w[submitted],
    'settled' => []
  }.freeze

  def can_transition_to?(new_status)
    VALID_TRANSITIONS[status]&.include?(new_status.to_s) || false
  end

  def transition_to!(new_status, operator = "system", note = nil)
    return false unless can_transition_to?(new_status)

    transaction do
      status_logs.create!(
        from_status: status_before_last_save || status,
        to_status: new_status,
        operator: operator,
        note: note
      )
      update!(status: new_status)
    end
    true
  end

  def recalculate_totals
    new_total_cost = waste_items.sum(:subtotal)
    purchase = store_monthly_purchase || 100_000.0
    new_waste_rate = purchase.positive? ? ((new_total_cost / purchase) * 100).round(2) : 0

    if new_total_cost != total_cost || new_waste_rate != waste_rate
      update_columns(
        total_cost: new_total_cost,
        waste_rate: new_waste_rate,
        updated_at: Time.current
      )
    end
  end

  def recalculate_totals!
    recalculate_totals
  end

  def abnormal?
    waste_rate > WASTE_RATE_THRESHOLD
  end

  def severity_level
    if waste_rate >= WASTE_RATE_CRITICAL_THRESHOLD
      :high
    elsif waste_rate >= WASTE_RATE_HIGH_THRESHOLD
      :medium
    elsif waste_rate >= WASTE_RATE_THRESHOLD
      :low
    else
      :normal
    end
  end

  def log_status_change
    return if status_logs.where(to_status: status).exists?

    status_logs.create!(
      from_status: status_before_last_save,
      to_status: status,
      operator: current_operator
    )
  end

  def trigger_anomaly_detection
    SidekiqSafe.perform_async(AnomalyDetectionJob, id)
  end

  def should_detect_anomaly?
    saved_change_to_total_cost? || saved_change_to_status? && %w[approved settled].include?(status)
  end

  def waste_reason_summary
    waste_items.group(:waste_reason).sum(:subtotal).sort_by { |_, v| -v }
  end

  def category_summary
    waste_items.group(:category).sum(:subtotal).sort_by { |_, v| -v }
  end

  def responsible_stores_summary
    cost_entries.group(:responsible_store).sum(:amount).sort_by { |_, v| -v }
  end

  def self.overall_waste_rate(start_date = nil, end_date = nil)
    reports = all
    reports = reports.by_date_range(start_date, end_date) if start_date && end_date
    total_cost = reports.sum(:total_cost)
    total_purchase = Store.active.sum(:monthly_purchase).presence || 1
    total_purchase.positive? ? ((total_cost / total_purchase) * 100).round(2) : 0
  end

  def self.waste_rate_by_store(start_date = nil, end_date = nil)
    reports = all
    reports = reports.by_date_range(start_date, end_date) if start_date && end_date
    reports.group(:store_id).sum(:total_cost).map do |store_id, cost|
      store = Store.find_by(id: store_id)
      next unless store

      purchase = store.monthly_purchase || 100_000.0
      rate = purchase.positive? ? ((cost / purchase) * 100).round(2) : 0
      { store: store, cost: cost, rate: rate }
    end.compact.sort_by { |r| -r[:rate] }
  end

  private

  def current_operator
    if defined?(Current) && Current.respond_to?(:user) && Current.user&.respond_to?(:name)
      Current.user.name
    else
      "system"
    end
  end
end
