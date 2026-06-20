class TicketOrdersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event
  before_action :set_ticket_order, only: %i[show edit update history]

  def index
    @q = @event.ticket_orders.includes(:ticket_type, :user).ransack(params[:q])
    @ticket_orders = @q.result.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @check_in_record = @ticket_order.check_in_record
    @refund_disputes = @ticket_order.refund_disputes.recent
  end

  def edit
  end

  def update
    PaperTrail.request(whodunnit: current_user.id.to_s) do
      if @ticket_order.update(ticket_order_params)
        redirect_to event_ticket_order_path(@event, @ticket_order), notice: t("ticket_order.successfully_updated")
      else
        render :edit, status: :unprocessable_content
      end
    end
  end

  def history
    @versions = @ticket_order.versions.includes(:item).order(created_at: :desc)
  end

  private

  def set_event
    @event = Event.find(params[:event_id])
  end

  def set_ticket_order
    @ticket_order = @event.ticket_orders.find(params[:id])
  end

  def ticket_order_params
    params.require(:ticket_order).permit(:status, :quantity, :total_amount, :buyer_name, :buyer_email, :buyer_phone, :remark, :ticket_type_id)
  end
end
