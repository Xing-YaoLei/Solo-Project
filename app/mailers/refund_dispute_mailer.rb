class RefundDisputeMailer < ApplicationMailer
  def notify_handler(dispute)
    @dispute = dispute
    @handler = dispute.handler
    @ticket_order = dispute.ticket_order
    @event = @ticket_order.event

    mail(
      to: @handler.email,
      subject: "[退票争议] #{@event.name} - 订单 #{@ticket_order.order_no} 需要处理"
    )
  end

  def remind_handler(dispute)
    @dispute = dispute
    @handler = dispute.handler
    @ticket_order = dispute.ticket_order
    @event = @ticket_order.event
    @hours_since = ((Time.current - @dispute.created_at) / 1.hour).round

    mail(
      to: @handler.email,
      subject: "[催办] 退票争议 #{@ticket_order.order_no} 已 #{@hours_since} 小时未处理"
    )
  end
end
