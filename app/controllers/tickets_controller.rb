class TicketsController < ApplicationController
  before_action :set_ticket, only: %i[show checkin qrcode]

  def index
    @tickets = Ticket.includes(:order, :ticket_type, :seat).order(created_at: :desc)
    @tickets = @tickets.where(status: params[:status]) if params[:status].present?
    @tickets = paginate(@tickets, per_page: 20)
  end

  def show
    @checkin_code = @ticket.checkin_code
    @status_logs = StatusLog.for_trackable(@ticket).recent.limit(10)
  end

  def checkin
    if @ticket.may_checkin?
      @ticket.checkin!
      redirect_to @ticket, notice: "签到成功"
    else
      redirect_to @ticket, alert: "当前票状态无法签到"
    end
  end

  def qrcode
    @checkin_code = @ticket.checkin_code
    if @checkin_code.nil?
      @ticket.generate_checkin_code!
      @checkin_code = @ticket.checkin_code
    end

    qr = RQRCode::QRCode.new(@checkin_code.qr_code_data)
    svg = qr.as_svg(offset: 0, color: "000", shape_rendering: "crispEdges", module_size: 6)
    send_data svg, type: "image/svg+xml", disposition: "inline"
  end
end
