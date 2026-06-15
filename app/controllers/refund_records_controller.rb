class RefundRecordsController < ApplicationController
  before_action :set_record, only: [:show]

  def index
    @records = RefundRecord.all
    @records = @records.by_student(params[:student_id])
       @records = @records.by_status(params[:refund_status] || params[:status])
    @records = @records.by_reason(params[:refund_reason_code])
    if params[:start_date].present? && params[:end_date].present?
      @records = @records.by_date_range(params[:start_date], params[:end_date])
    end
    @records = @records.includes(:student, :member_profile, :operator).order(created_at: :desc).page(params[:page]).per(30)

    @refund_reason_stats = RefundRecord.group(:refund_reason_code).count
    @refund_status_stats = RefundRecord.group(:refund_status).count
  end

  def show
    @student = @record.student
    @member_profile = @record.member_profile || @student.member_profile
    @related_redemptions = @student.redemption_records.order(redeemed_at: :desc).limit(5)
    @related_refunds = @student.refund_records.where.not(id: @record.id).order(created_at: :desc).limit(5)
  end

  private

  def set_record
    @record = RefundRecord.find(params[:id])
  end
end
