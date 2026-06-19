class WorkOrder < ApplicationRecord
  STATUSES = %w[pending quoted in_progress completed cancelled].freeze
  PRIORITIES = %w[low normal high urgent].freeze

  belongs_to :user
  belongs_to :parent_work_order, class_name: 'WorkOrder', optional: true
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :work_order_items, dependent: :destroy
  has_many :work_order_parts, dependent: :destroy
  has_many :quotes, dependent: :destroy
  has_many :inspection_photos, dependent: :destroy
  has_many :attachments, dependent: :destroy
  has_many :notes, dependent: :destroy
  has_many :timeline_events, dependent: :destroy
  has_many :stock_alerts, dependent: :destroy
  has_many :child_work_orders, class_name: 'WorkOrder', foreign_key: 'parent_work_order_id'
  has_many :parts, through: :work_order_parts

  enum :status, STATUSES.zip(STATUSES).to_h
  enum :priority, PRIORITIES.zip(PRIORITIES).to_h

  before_validation :generate_work_order_no, on: :create

  scope :repairs, -> { where(is_repair: true) }
  scope :active, -> { where.not(status: %w[cancelled completed]) }

  def self.repair_rate(period)
    total_work_orders = where(created_at: period).count
    return 0.0 if total_work_orders.zero?

    repair_count = repairs.where(created_at: period).count
    (repair_count.to_f / total_work_orders * 100).round(2)
  end

  private

  def generate_work_order_no
    return if work_order_no.present?

    date_str = Time.current.strftime('%Y%m%d')
    prefix = "WO#{date_str}"
    last_order = WorkOrder.where('work_order_no LIKE ?', "#{prefix}%").order(:work_order_no).last
    sequence = if last_order && last_order.work_order_no.match(/(\d{4})$/)
                 (Regexp.last_match(1).to_i + 1).to_s.rjust(4, '0')
               else
                 '0001'
               end
    self.work_order_no = "#{prefix}#{sequence}"
  end
end
