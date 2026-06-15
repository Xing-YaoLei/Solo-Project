class RedemptionRecordsController < ApplicationController
  before_action :set_record, only: [:show]

  def index
    @records = RedemptionRecord.all
    @records = @records.by_student(params[:student_id])
    @records = @records.by_status(params[:status])
    if params[:start_date].present? && params[:end_date].present?
      @records = @records.by_date_range(params[:start_date], params[:end_date])
    end
    @records = @records.includes(:student, :benefit_rule, :operator).order(redeemed_at: :desc, created_at: :desc).page(params[:page]).per(30)
  end

  def show
    @student = @record.student
    @member_profile = @student.member_profile
    @related_redemptions = @student.redemption_records.where.not(id: @record.id).order(redeemed_at: :desc).limit(5)
    @related_refunds = @student.refund_records.order(created_at: :desc).limit(5)
  end

  private

  def set_record
    @record = RedemptionRecord.find(params[:id])
  end
end
