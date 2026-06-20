class Events::CheckInDesksController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event

  def show
    @sponsors = @event.sponsors.by_level
    @ticket_types = @event.ticket_types.includes(:check_in_records)
    @check_in_records = @event.check_in_records.includes(:ticket_order, :ticket_type, :operator).recent.page(params[:check_in_page]).per(20)
    @check_in_stats = {
      total_paid: @event.paid_order_count + @event.check_in_count,
      checked_in: @event.check_in_count,
      rate: @event.check_in_rate
    }
    @pending_disputes = @event.refund_disputes.pending.count
  end

  private

  def set_event
    @event = Event.find(params[:event_id])
  end
end
