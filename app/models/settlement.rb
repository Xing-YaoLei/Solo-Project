class Settlement < ApplicationRecord
  include AASM

  enum :status, { draft: 0, calculating: 1, pending_review: 2, approved: 3, rejected: 4, exported: 5 }

  has_many :settlement_items, dependent: :destroy
  has_many :orders, through: :settlement_items
  has_many :channel_commissions, dependent: :destroy

  validates :period_start, presence: true
  validates :period_end, presence: true
  validate :period_end_after_start

  aasm column: :status, enum: true do
    state :draft, initial: true
    state :calculating
    state :pending_review
    state :approved
    state :rejected
    state :exported

    event :calculate do
      transitions from: :draft, to: :calculating
    end

    event :finish_calculation do
      transitions from: :calculating, to: :pending_review
    end

    event :approve do
      transitions from: :pending_review, to: :approved
    end

    event :reject do
      transitions from: :pending_review, to: :rejected
    end

    event :export do
      transitions from: :approved, to: :exported
    end
  end

  def calculate_settlement!
    return unless may_calculate?

    aasm.fire!(:calculate)
    SettlementCalculationJob.perform_later(id)
  end

  def perform_calculation!
    ActiveRecord::Base.transaction do
      settlement_items.destroy_all

      period_orders = Order.where(paid_at: period_start.beginning_of_day..period_end.end_of_day, status: [:paid, :refunded, :partially_refunded])

      period_orders.find_each do |order|
        enrollment = order.enrollments.first
        item_type = determine_item_type(order, enrollment)

        settlement_items.create!(
          order: order,
          enrollment: enrollment,
          item_type: item_type,
          amount: order.amount,
          commission_amount: order.commission_amount,
          status: :pending
        )
      end

      completed_count = settlement_items.joins(:enrollment).where(enrollments: { status: :completed }).count
      passed_exams_count = settlement_items.joins(:enrollment).where(enrollments: { exam_passed: true }).count
      refund_count = settlement_items.joins(:order).where(orders: { status: :refunded }).count
      refund_amount = settlement_items.joins(:order).where(orders: { status: :refunded }).sum("orders.refund_amount")

      total_amount = settlement_items.sum(:amount)
      commission_amount = settlement_items.sum(:commission_amount)

      update!(
        total_orders: settlement_items.count,
        total_amount: total_amount,
        completed_courses_count: completed_count,
        passed_exams_count: passed_exams_count,
        refund_count: refund_count,
        refund_amount: refund_amount,
        channel_commission_amount: commission_amount,
        net_revenue: total_amount - refund_amount - commission_amount
      )

      finish_calculation!
    end
  end

  def to_excel
    Axlsx::Package.new do |p|
      p.workbook.add_worksheet(name: "结算明细") do |sheet|
        sheet.add_row ["订单号", "学员", "课程", "渠道", "订单金额", "分成金额", "订单状态", "完课状态", "考试状态", "退款金额", "结算时间"]
        settlement_items.includes(:order, :enrollment, order: [:user, :course, :channel]).find_each do |item|
          order = item.order
          enrollment = item.enrollment
          sheet.add_row [
            order.order_no,
            order.user&.name,
            order.course&.title,
            order.channel&.name,
            order.amount,
            item.commission_amount,
            order.status,
            enrollment&.status,
            enrollment&.exam_passed? ? "通过" : "未通过",
            order.refund_amount || 0,
            created_at.strftime("%Y-%m-%d")
          ]
        end
      end
    end.to_stream.read
  end

  private

  def period_end_after_start
    return if period_end.blank? || period_start.blank?
    errors.add(:period_end, "必须晚于开始日期") if period_end <= period_start
  end

  def determine_item_type(order, enrollment)
    if order.refunded?
      :refund
    elsif enrollment&.completed? && enrollment&.exam_passed?
      :full_completion
    elsif enrollment&.completed?
      :course_completed
    else
      :enrollment
    end
  end
end
