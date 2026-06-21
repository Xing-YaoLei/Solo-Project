class DashboardController < ApplicationController
  include Pagy::Backend

  AGGREGATE_STATUSES = {
    "active" => %w[draft pending in_progress material_missing review_required],
    "finished" => %w[completed closed]
  }.freeze

  def index
    @filter_status = params[:status]
    @filter_channel = params[:channel]
    @filter_responsible = params[:responsible]
    @keyword = params[:keyword]

    cases = LegalCase.includes(:client).order(updated_at: :desc)
    cases = filter_by_status(cases, @filter_status)
    cases = cases.by_channel(@filter_channel)
    cases = cases.by_responsible(@filter_responsible)
    if @keyword.present?
      cases = cases.joins(:client).where(
        "legal_cases.title ILIKE :kw OR legal_cases.case_number ILIKE :kw OR clients.name ILIKE :kw OR clients.phone ILIKE :kw",
        kw: "%#{@keyword}%"
      )
    end

    @pagy, @cases = pagy(cases, items: 20)

    @stats = {
      total: LegalCase.count,
      active: LegalCase.active.count,
      need_materials: LegalCase.need_materials.count,
      under_review: LegalCase.under_review.count,
      completed: LegalCase.finished.count
    }

    @channels = LegalCase::SOURCE_CHANNELS
    @responsible_persons = LegalCase.distinct.pluck(:responsible_person).compact
  end

  def statistics
    @by_status = LegalCase.group(:status).count
    @by_channel = LegalCase.group(:source_channel).count
    @by_responsible = LegalCase.group(:responsible_person).count
    @by_category = LegalCase.group(:category).count

    @monthly_trend = compute_monthly_trend(6)

    @status_transitions = StatusTransition.includes(:legal_case)
                                          .order(created_at: :desc)
                                          .limit(50)
  end

  private

  def filter_by_status(cases, status)
    return cases if status.blank?

    if AGGREGATE_STATUSES.key?(status)
      cases.where(status: AGGREGATE_STATUSES[status])
    else
      cases.where(status: status)
    end
  end

  def compute_monthly_trend(months_back)
    start_date = months_back.months.ago.beginning_of_month
    raw = LegalCase.where("created_at >= ?", start_date)
                   .group("DATE_TRUNC('month', created_at)")
                   .count

    result = {}
    current = Date.today.beginning_of_month
    months_back.times do
      key = current.beginning_of_month
      # find value from raw hash by matching Date or Time
      value = raw.find { |k, _| k.is_a?(Time) ? k.to_date == key : k.to_date == key }&.last || 0
      result[key] = value
      current = current.ago(1.month)
    end
    result.sort.reverse.to_h
  end
end
