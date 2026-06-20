class RefundDisputesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :set_refund_dispute, only: %i[show process_dispute resolve reject]

  def index
    @q = RefundDispute.by_event(@event.id).ransack(params[:q])
    @refund_disputes = @q.result.includes(:ticket_order, :handler).recent.page(params[:page]).per(20)
  end

  def show
    @dispute_logs = @refund_dispute.dispute_logs.chronological
  end

  def create
    ticket_order = @event.ticket_orders.find(params[:refund_dispute][:ticket_order_id])

    unless ticket_order.can_refund?
      redirect_to event_ticket_order_path(@event, ticket_order), alert: t("refund_dispute.cannot_refund")
      return
    end

    @refund_dispute = RefundDispute.create!(
      ticket_order: ticket_order,
      reporter_name: dispute_params[:reporter_name],
      reporter_phone: dispute_params[:reporter_phone],
      reason: dispute_params[:reason],
      handler_id: dispute_params[:handler_id],
      status: "pending"
    )

    redirect_to event_refund_dispute_path(@event, @refund_dispute), notice: t("refund_dispute.successfully_created")
  rescue ActiveRecord::RecordInvalid => e
    redirect_back fallback_location: event_ticket_orders_path(@event), alert: e.message
  end

  def process_dispute
    unless current_user.can_handle_dispute?
      redirect_to event_refund_dispute_path(@event, @refund_dispute), alert: t("common.unauthorized")
      return
    end

    @refund_dispute.start_processing!(current_user)
    redirect_to event_refund_dispute_path(@event, @refund_dispute), notice: t("refund_dispute.started_processing")
  end

  def resolve
    unless current_user.can_handle_dispute?
      redirect_to event_refund_dispute_path(@event, @refund_dispute), alert: t("common.unauthorized")
      return
    end

    @refund_dispute.resolve!(resolve_params[:handler_action], resolve_params[:handler_remark], current_user)

    if resolve_params[:handler_action] == "refund"
      @refund_dispute.ticket_order.update!(status: "refunded")
    end

    redirect_to event_refund_dispute_path(@event, @refund_dispute), notice: t("refund_dispute.successfully_resolved")
  end

  def reject
    unless current_user.can_handle_dispute?
      redirect_to event_refund_dispute_path(@event, @refund_dispute), alert: t("common.unauthorized")
      return
    end

    @refund_dispute.reject!(reject_params[:handler_action], reject_params[:handler_remark], current_user)
    redirect_to event_refund_dispute_path(@event, @refund_dispute), notice: t("refund_dispute.successfully_rejected")
  end

  private

  def set_event
    @event = Event.find(params[:event_id])
  end

  def set_refund_dispute
    @refund_dispute = RefundDispute.by_event(@event.id).find(params[:id])
  end

  def dispute_params
    params.require(:refund_dispute).permit(:ticket_order_id, :reporter_name, :reporter_phone, :reason, :handler_id)
  end

  def resolve_params
    params.require(:refund_dispute).permit(:handler_action, :handler_remark)
  end

  def reject_params
    params.require(:refund_dispute).permit(:handler_action, :handler_remark)
  end
end
