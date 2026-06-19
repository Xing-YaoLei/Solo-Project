class CheckinCodesController < ApplicationController
  before_action :set_checkin_code, only: %i[show verify use]

  def index
    @checkin_codes = CheckinCode.includes(ticket: [:order, :ticket_type]).order(created_at: :desc)
    @checkin_codes = @checkin_codes.where(status: params[:status]) if params[:status].present?
    @checkin_codes = paginate(@checkin_codes, per_page: 20)
  end

  def show
    @status_logs = StatusLog.for_trackable(@checkin_code).recent.limit(10)
  end

  def verify
    if @checkin_code.may_verify?
      @checkin_code.verify!
      redirect_to @checkin_code, notice: "签到码验证成功"
    else
      redirect_to @checkin_code, alert: "当前状态无法验证"
    end
  end

  def use
    if @checkin_code.may_use?
      @checkin_code.use!
      redirect_to @checkin_code, notice: "签到码已核销，签到完成"
    else
      redirect_to @checkin_code, alert: "当前状态无法核销"
    end
  end

  private

  def set_checkin_code
    @checkin_code = CheckinCode.find(params[:id])
  end
end
