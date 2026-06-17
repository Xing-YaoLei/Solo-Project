class DashboardController < ApplicationController
  def index
    @access_records = AccessRecord.recent.limit(20)
    @parking_bills = ParkingBill.order(created_at: :desc).limit(20)
    @inspection_routes = InspectionRoute.recent.limit(10)
    @active_downtimes = EquipmentDowntime.active.recent.limit(5)
    @unread_notifications = Notification.unread.recent.limit(10)

    @access_records = @access_records.by_direction(params[:direction]) if params[:direction].present?
    @access_records = @access_records.by_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?

    @parking_bills = @parking_bills.where(status: params[:bill_status]) if params[:bill_status].present?
    @parking_bills = @parking_bills.where(bill_type: params[:bill_type]) if params[:bill_type].present?

    @inspection_routes = @inspection_routes.by_status(params[:route_status]) if params[:route_status].present?

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end
end
