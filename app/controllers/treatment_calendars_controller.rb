class TreatmentCalendarsController < ApplicationController
  before_action :set_calendar_data, only: [ :index, :show ]

  def index
    @areas = Area.all
    @thresholds = TreatmentCalendarThreshold.includes(:area).index_by(&:area_id)
    @sessions_by_date = calendar_sessions_grouped
  end

  def show
    @date = Date.parse(params[:id])
    @sessions = TrainingSession.includes(prescription: { assessment_record: [], therapist: [] }, equipment: [])
                               .where(session_date: @date)
                               .order(:session_date)
  end

  def update_threshold
    @threshold = TreatmentCalendarThreshold.find_or_initialize_by(area_id: params[:area_id])
    @threshold.assign_values(threshold_params)
    @threshold.save!
  end

  private

  def set_calendar_data
    @current_month = params[:month].present? ? Date.parse("#{params[:month]}-01") : Date.current.beginning_of_month
  end

  def calendar_sessions_grouped
    start_date = @current_month.beginning_of_month
    end_date = @current_month.end_of_month
    TrainingSession.includes(prescription: [ :assessment_record ])
                   .where(session_date: start_date..end_date)
                   .group_by(&:session_date)
  end

  def threshold_params
    params.require(:treatment_calendar_threshold).permit(:max_daily_treatments, :min_interval_minutes, time_slots: {})
  end
end
