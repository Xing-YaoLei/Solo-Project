class CheckInRecordsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :set_check_in_record, only: %i[show destroy]

  def index
    @q = @event.check_in_records.includes(:ticket_order, :ticket_type, :operator).ransack(params[:q])
    @check_in_records = @q.result.recent.page(params[:page]).per(20)
  end

  def show
  end

  def create
    @ticket_order = @event.ticket_orders.find_by(order_no: check_in_params[:order_no])

    unless @ticket_order
      redirect_to event_check_in_desk_path(@event), alert: t("check_in_record.order_not_found")
      return
    end

    unless @ticket_order.can_check_in?
      redirect_to event_check_in_desk_path(@event), alert: t("check_in_record.cannot_check_in")
      return
    end

    @check_in_record = CheckInRecord.create!(
      ticket_order: @ticket_order,
      ticket_type: @ticket_order.ticket_type,
      event: @event,
      operator: current_user,
      check_in_time: Time.current,
      check_in_method: check_in_params[:check_in_method] || "manual",
      note: check_in_params[:note]
    )

    redirect_to event_check_in_desk_path(@event), notice: t("check_in_record.successfully_checked_in")
  rescue ActiveRecord::RecordInvalid => e
    redirect_to event_check_in_desk_path(@event), alert: e.message
  end

  def destroy
    authorize_admin!
    ticket_order = @check_in_record.ticket_order
    @check_in_record.destroy!
    ticket_order.update!(status: "paid")
    redirect_to event_check_in_records_path(@event), notice: t("check_in_record.successfully_revoked")
  end

  private

  def set_event
    @event = Event.find(params[:event_id])
  end

  def set_check_in_record
    @check_in_record = @event.check_in_records.find(params[:id])
  end

  def check_in_params
    params.require(:check_in_record).permit(:order_no, :check_in_method, :note)
  end

  def authorize_admin!
    unless current_user.admin?
      redirect_to event_check_in_records_path(@event), alert: t("common.unauthorized")
    end
  end
end
