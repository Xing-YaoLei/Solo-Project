class Analytics::CombinedQueriesController < ApplicationController
  def index
    @records = AssessmentRecord.includes(:patient, :scale, :assessor, training_prescriptions: :training_sessions)

    @records = @records.by_status(params[:status]) if params[:status].present?
    @records = @records.by_date_range(params[:start_date], params[:end_date]) if params[:start_date].present? && params[:end_date].present?
    @records = @records.joins(:patient).where(patients: { area_id: params[:area_id] }) if params[:area_id].present?
    @records = @records.where(assessor_id: params[:therapist_id]) if params[:therapist_id].present?

    if params[:statuses].present?
      @records = @records.where(status: params[:statuses])
    end

    @records = @records.order(assessed_at: :desc).page(params[:page])

    @areas = Area.all
    @therapists = User.by_role(:therapist)
  end
end
