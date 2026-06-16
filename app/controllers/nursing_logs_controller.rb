class NursingLogsController < ApplicationController
  before_action :set_nursing_log, only: [:show]

  def index
    @nursing_logs = NursingLog.includes(:patient, :nurse, :assessment_record).order(logged_at: :desc)
    @nursing_logs = @nursing_logs.where(patient_id: params[:patient_id]) if params[:patient_id].present?
    @nursing_logs = @nursing_logs.where(care_type: params[:care_type]) if params[:care_type].present?
    if params[:start_date].present? && params[:end_date].present?
      @nursing_logs = @nursing_logs.where(logged_at: params[:start_date]..params[:end_date])
    end
    @patients = Patient.all
  end

  def show
  end

  def new
    @nursing_log = NursingLog.new
    @patients = Patient.all
    @assessment_records = params[:patient_id].present? ? AssessmentRecord.where(patient_id: params[:patient_id]) : []
  end

  def create
    @nursing_log = NursingLog.new(nursing_log_params)
    if @nursing_log.save
      redirect_to @nursing_log, notice: "护理日志创建成功"
    else
      @patients = Patient.all
      @assessment_records = @nursing_log.patient ? AssessmentRecord.where(patient_id: @nursing_log.patient_id) : []
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_nursing_log
    @nursing_log = NursingLog.includes(:patient, :nurse, :assessment_record).find(params[:id])
  end

  def nursing_log_params
    params.require(:nursing_log).permit(:patient_id, :nurse_id, :assessment_record_id, :care_type, :content, :logged_at)
  end
end
