class DailySummary < ApplicationRecord
  store :operator_stats, accessors: %i[order_counts completion_rates], coder: JSON
  store :abnormal_reason_stats, accessors: %i[reason_counts], coder: JSON
  store :product_tag_stats, accessors: %i[tag_counts], coder: JSON

  validates :summary_date, presence: true
  validates :summary_date, uniqueness: { scope: :source }

  scope :date_range, ->(start_date, end_date) { where(summary_date: start_date..end_date) }
  scope :by_source, ->(source) { where(source: source) if source.present? }

  def self.calculate_for(date, source = nil)
    orders = PickupOrder.where(created_at: date.beginning_of_day..date.end_of_day)
    orders = orders.where(source: source) if source.present?

    completed = orders.completed
    on_time = completed.select(&:on_time?)
    delayed = completed.reject(&:on_time?)
    shortage = orders.with_shortage

    operator_stats = calculate_operator_stats(completed)
    abnormal_stats = calculate_abnormal_stats(shortage)
    product_tag_stats = calculate_product_tag_stats(orders)

    summary = find_or_initialize_by(summary_date: date, source: source || 'all')
    summary.update!(
      total_orders: orders.count,
      completed_orders: completed.count,
      on_time_orders: on_time.count,
      delayed_orders: delayed.count,
      shortage_orders: shortage.count,
      on_time_rate: completed.count > 0 ? (on_time.count.to_f / completed.count * 100).round(2) : 0,
      operator_stats: operator_stats,
      abnormal_reason_stats: abnormal_stats,
      product_tag_stats: product_tag_stats
    )
    summary
  end

  def self.calculate_operator_stats(orders)
    stats = {}
    orders.group_by(&:operator_id).each do |operator_id, os|
      next unless operator_id
      operator = User.find_by(id: operator_id)
      next unless operator
      stats[operator_id] = {
        name: operator.name,
        total: os.count,
        on_time: os.select(&:on_time?).count,
        rate: os.count > 0 ? (os.select(&:on_time?).count.to_f / os.count * 100).round(2) : 0
      }
    end
    stats
  end

  def self.calculate_abnormal_stats(orders)
    reason_counts = Hash.new(0)
    orders.each do |order|
      order.shortage_records.each do |sr|
        reason_counts[sr.reason] += 1
      end
    end
    { reason_counts: reason_counts }
  end

  def self.calculate_product_tag_stats(orders)
    tag_counts = Hash.new(0)
    orders.each do |order|
      order.pickup_items.each do |item|
        tag_counts[item.product_tag] += item.actual_quantity
      end
    end
    { tag_counts: tag_counts }
  end

  def self.aggregate_by_period(start_date, end_date, source = nil)
    summaries = date_range(start_date, end_date).by_source(source)
    {
      total_orders: summaries.sum(:total_orders),
      completed_orders: summaries.sum(:completed_orders),
      on_time_orders: summaries.sum(:on_time_orders),
      delayed_orders: summaries.sum(:delayed_orders),
      shortage_orders: summaries.sum(:shortage_orders),
      average_on_time_rate: summaries.average(:on_time_rate).to_f.round(2),
      by_source: summaries.group(:source).sum(:total_orders),
      by_operator: aggregate_operator_stats(summaries),
      by_abnormal_reason: aggregate_abnormal_reason_stats(summaries),
      by_product_tag: aggregate_product_tag_stats(summaries)
    }
  end

  def self.aggregate_operator_stats(summaries)
    aggregated = Hash.new { |h, k| h[k] = { total: 0, on_time: 0 } }
    summaries.each do |summary|
      summary.operator_stats.each do |_op_id, stats|
        aggregated[stats['name']][:total] += stats['total']
        aggregated[stats['name']][:on_time] += stats['on_time']
      end
    end
    aggregated.transform_values do |v|
      v[:rate] = v[:total] > 0 ? (v[:on_time].to_f / v[:total] * 100).round(2) : 0
      v
    end
  end

  def self.aggregate_abnormal_reason_stats(summaries)
    aggregated = Hash.new(0)
    summaries.each do |summary|
      reason_counts = summary.abnormal_reason_stats['reason_counts'] || {}
      reason_counts.each do |reason, count|
        aggregated[reason] += count
      end
    end
    aggregated
  end

  def self.aggregate_product_tag_stats(summaries)
    aggregated = Hash.new(0)
    summaries.each do |summary|
      tag_counts = summary.product_tag_stats['tag_counts'] || {}
      tag_counts.each do |tag, count|
        aggregated[tag] += count
      end
    end
    aggregated
  end
end
