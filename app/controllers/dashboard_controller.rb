class DashboardController < ApplicationController
  def index
    @performances = Performance.order(start_time: :desc).limit(5)
    @recent_orders = Order.order(created_at: :desc).limit(5)
    @open_exceptions = ExceptionRecord.where(status: [:open, :assigned, :resolving]).order(created_at: :desc).limit(5)
    @recent_logs = StatusLog.recent.limit(10)

    @stats = {
      total_performances: Performance.count,
      ongoing_performances: Performance.ongoing.count,
      total_orders: Order.count,
      paid_orders: Order.paid.count,
      confirmed_orders: Order.confirmed.count,
      total_tickets: Ticket.count,
      checked_in_tickets: Ticket.checked_in.count,
      open_exceptions: ExceptionRecord.where(status: [:open, :assigned, :resolving]).count,
      total_sponsors: Sponsor.active.count
    }
  end
end
