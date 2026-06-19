class TimelineEventsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order

  def index
    @timeline_events = @work_order.timeline_events.includes(:user).order(created_at: :desc)
    @pagy, @timeline_events = pagy(@timeline_events)
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end
end
