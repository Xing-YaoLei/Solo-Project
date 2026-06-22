class DashboardController < ApplicationController
  skip_after_action :verify_authorized, only: [:index]

  def index
    authorize :dashboard, :index?

    add_breadcrumb "首页", nil
    @page_title = "数据概览 | 合规审计结算台"

    load_dashboard_stats
    load_recent_items
    load_rectification_data
  end

  private

  def load_dashboard_stats
    @stats = {
      pending_audits: policy_scope(Audit).pending.count,
      in_progress_audits: policy_scope(Audit).in_progress.count,
      open_exceptions: policy_scope(ExceptionOrder).open.count,
      rectification_rate: calculate_rectification_rate
    }
  end

  def calculate_rectification_rate
    calc = RectificationRateCalculator.call(
      policy_scope(ExceptionOrder),
      :last_30_days,
      include_details: false
    )
    calc.success? ? calc.result[:overall][:rate] : 0.0
  end

  def load_recent_items
    @recent_audits = policy_scope(Audit).includes(:supplier, :creator)
      .order(created_at: :desc)
      .limit(8)

    @recent_exceptions = policy_scope(ExceptionOrder).includes(audit: [:supplier], handler: [])
      .order(created_at: :desc)
      .limit(6)

    @pending_tasks = load_pending_tasks
  end

  def load_pending_tasks
    tasks = []

    policy_scope(ExceptionOrder).open.by_handler(current_user.id).find_each do |ex|
      tasks << {
        type: :exception,
        id: ex.id,
        title: ex.title,
        status: ex.status,
        severity: ex.severity,
        due_at: ex.due_at,
        path: exception_order_path(ex),
        created_at: ex.created_at
      }
    end

    policy_scope(Audit).pending.find_each do |audit|
      next unless audit.creator_id == current_user.id || current_user.can_approve_audits?

      tasks << {
        type: :audit,
        id: audit.id,
        title: audit.title,
        status: audit.status,
        severity: nil,
        due_at: audit.end_at,
        path: audit_path(audit),
        created_at: audit.created_at
      }
    end

    tasks.sort_by { |t| [t[:due_at] || 1.year.from_now, t[:created_at]] }.first(10)
  end

  def load_rectification_data
    calc = RectificationRateCalculator.call(
      policy_scope(ExceptionOrder),
      :last_30_days,
      group_by: :trend,
      include_details: true
    )

    if calc.success?
      result = calc.result
      @rectification_overall = result[:overall]
      @rectification_by_severity = result[:by_severity]
      @rectification_trend = build_trend_chart_data(result[:trend])
      @rectification_caliber = result[:caliber_note]
    else
      @rectification_overall = {}
      @rectification_by_severity = {}
      @rectification_trend = []
      @rectification_caliber = nil
    end
  end

  def build_trend_chart_data(trend)
    return [] unless trend.present?

    trend.map do |day|
      {
        date: day[:date].strftime("%m-%d"),
        total: day[:total],
        resolved: day[:resolved],
        rate: day[:cumulative_rate]
      }
    end
  end
end
