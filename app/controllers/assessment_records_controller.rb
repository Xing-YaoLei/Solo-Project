class AssessmentRecordsController < ApplicationController
  before_action :set_assessment_record, only: [:show]
  before_action :set_form_data, only: [:new, :create]

  def index
    @assessment_records = AssessmentRecord.includes(:patient, :scale, :assessor)
    @assessment_records = @assessment_records.by_status(params[:status]) if params[:status].present?
    @assessment_records = @assessment_records.by_date_range(params[:start_date], params[:end_date]) if params[:start_date].present? && params[:end_date].present?
    @assessment_records = @assessment_records.joins(:patient).where(patients: { area_id: params[:area_id] }) if params[:area_id].present?
    @assessment_records = @assessment_records.where(assessor_id: params[:assessor_id]) if params[:assessor_id].present?
    @assessment_records = @assessment_records.order(assessed_at: :desc).page(params[:page])

    @areas = Area.all
    @assessors = User.by_role(:therapist)
  end

  def show
  end

  def new
    if params[:scale_id].present?
      @assessment_record = AssessmentService.new.build_record(
        params[:patient_id], params[:scale_id], 1
      )
      @scale_items = @assessment_record.scale.scale_items.order(:sort_order)
    else
      @assessment_record = AssessmentRecord.new(assessed_at: Date.current, status: :draft)
      @scale_items = []
    end
    @scales = AssessmentScale.active.order(:name)
    @patients = Patient.all
  end

  def create
    @assessment_record = AssessmentRecord.new(assessment_record_params)
    service = AssessmentService.new

    if @assessment_record.save
      @assessment_record.update(total_score: service.calculate_score(@assessment_record))
      @assessment_record.update(grade: service.assign_grade(@assessment_record))
      redirect_to assessment_record_path(@assessment_record), notice: "评估记录创建成功"
    else
      @scales = AssessmentScale.active.order(:name)
      @patients = Patient.all
      @scale_items = @assessment_record.scale&.scale_items&.order(:sort_order) || []
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_assessment_record
    @assessment_record = AssessmentRecord.includes(:patient, :scale, :assessor).find(params[:id])
  end

  def set_form_data
    @scales = AssessmentScale.active.order(:name)
    @patients = Patient.all
  end

  def assessment_record_params
    params.require(:assessment_record).permit(:patient_id, :scale_id, :assessor_id, :assessed_at, :status, item_scores: {})
  end
end
