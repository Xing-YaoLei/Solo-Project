class DashboardController < ApplicationController
  include Pagy::Backend

  def index
    @filter_status = params[:status]
    @filter_channel = params[:channel]
    @filter_responsible = params[:responsible]
    @keyword = params[:keyword]

    cases = LegalCase.includes(:client).order(updated_at: :desc)
    cases = cases.where(status: @filter_status) if @filter_status.present?
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

    @monthly_trend = LegalCase.where("created_at >= ?", 6.months.ago)
                              .group_by_month(:created_at)
                              .count

    @status_transitions = StatusTransition.includes(:legal_case)
                                          .order(created_at: :desc)
                                          .limit(50)
  end
end
