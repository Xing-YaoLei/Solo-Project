class SettlementsController < ApplicationController
  before_action :set_settlement, only: [:show, :submit, :deny, :retry, :supplement, :close, :timeline]

  def index
    @settlements = Settlement.includes(:patient, :assessment_record)
    @settlements = @settlements.by_status(params[:status]) if params[:status].present?
    @settlements = @settlements.where(patient_id: params[:patient_id]) if params[:patient_id].present?
    if params[:start_date].present? && params[:end_date].present?
      @settlements = @settlements.where(submitted_at: params[:start_date]..params[:end_date])
    end
    @settlements = @settlements.order(created_at: :desc).page(params[:page])

    @patients = Patient.all
  end

  def show
    @denial_actions = @settlement.denial_actions.includes(:operator).order(performed_at: :asc)
  end

  def new
    @settlement = Settlement.new
    @patients = Patient.all
    @assessment_records = AssessmentRecord.where(status: :completed)
  end

  def create
    @settlement = Settlement.new(settlement_params)
    if @settlement.save
      redirect_to settlement_path(@settlement), notice: "结算单创建成功"
    else
      @patients = Patient.all
      @assessment_records = AssessmentRecord.where(status: :completed)
      render :new, status: :unprocessable_entity
    end
  end

  def submit
    processor = SettlementProcessor.new
    processor.submit_settlement(@settlement)
    redirect_to settlement_path(@settlement), notice: "结算单已提交"
  rescue => e
    redirect_to settlement_path(@settlement), alert: e.message
  end

  def deny
    processor = SettlementProcessor.new
    processor.process_denial(@settlement, params[:reason], current_user)
    redirect_to settlement_path(@settlement), notice: "结算单已驳回"
  rescue => e
    redirect_to settlement_path(@settlement), alert: e.message
  end

  def retry
    processor = SettlementProcessor.new
    processor.process_retry(@settlement, params[:reason], current_user)
    redirect_to settlement_path(@settlement), notice: "结算单已重新提交"
  rescue => e
    redirect_to settlement_path(@settlement), alert: e.message
  end

  def supplement
    processor = SettlementProcessor.new
    materials = params[:materials].present? ? params[:materials].split(",") : []
    processor.process_supplement(@settlement, materials, params[:reason], current_user)
    redirect_to settlement_path(@settlement), notice: "补充材料已提交"
  rescue => e
    redirect_to settlement_path(@settlement), alert: e.message
  end

  def close
    processor = SettlementProcessor.new
    processor.process_close(@settlement, params[:reason], current_user)
    redirect_to settlement_path(@settlement), notice: "结算单已关闭"
  rescue => e
    redirect_to settlement_path(@settlement), alert: e.message
  end

  def timeline
    @denial_actions = @settlement.denial_actions.includes(:operator).order(performed_at: :asc)
    render json: @denial_actions.as_json(include: :operator, methods: :action_type)
  end

  private

  def set_settlement
    @settlement = Settlement.includes(:patient, :assessment_record).find(params[:id])
  end

  def settlement_params
    params.require(:settlement).permit(:patient_id, :assessment_record_id, :amount, :insurance_type)
  end

  def current_user
    User.first || raise("No current user")
  end
end
