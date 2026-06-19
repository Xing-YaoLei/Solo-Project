class StockAlertsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_stock_alert, only: %i[show confirm_impact reassign resolve]

  def index
    @stock_alerts = StockAlert.includes(:part, :work_order, :handler, :reassigned_to).order(created_at: :desc)
    @stock_alerts = @stock_alerts.where(status: params[:status]) if params[:status].present?
    @pagy, @stock_alerts = pagy(@stock_alerts)

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end

  def show
    @work_order = @stock_alert.work_order
  end

  def confirm_impact
    respond_to do |format|
      if @stock_alert.confirm_impact(params[:affected_scope], params[:handler_id])
        @stock_alert.work_order.timeline_events.create!(
          event_type: :part_shortage,
          user: current_user,
          content: "库存告警确认影响范围: #{@stock_alert.part&.name} - #{params[:affected_scope]}",
          metadata: { stock_alert_id: @stock_alert.id, affected_scope: params[:affected_scope], handler_id: params[:handler_id] }
        )
        format.html { redirect_to @stock_alert, notice: '影响范围已确认。' }
        format.turbo_stream { redirect_to @stock_alert, notice: '影响范围已确认。' }
      else
        format.html { redirect_to @stock_alert, alert: @stock_alert.errors.full_messages.join(', ') }
        format.turbo_stream { render :show, status: :unprocessable_entity }
      end
    end
  end

  def reassign
    respond_to do |format|
      if @stock_alert.reassign(params[:reassigned_to_id], params[:supplementary_note])
        @stock_alert.work_order.timeline_events.create!(
          event_type: :part_shortage,
          user: current_user,
          content: "库存告警责任人已调整，补充说明: #{params[:supplementary_note]}",
          metadata: { stock_alert_id: @stock_alert.id, reassigned_to_id: params[:reassigned_to_id], supplementary_note: params[:supplementary_note] }
        )
        format.html { redirect_to @stock_alert, notice: '责任人已调整。' }
        format.turbo_stream { redirect_to @stock_alert, notice: '责任人已调整。' }
      else
        format.html { redirect_to @stock_alert, alert: @stock_alert.errors.full_messages.join(', ') }
        format.turbo_stream { render :show, status: :unprocessable_entity }
      end
    end
  end

  def resolve
    respond_to do |format|
      if @stock_alert.update(status: :resolved, resolved_at: Time.current)
        @stock_alert.work_order.timeline_events.create!(
          event_type: :part_shortage,
          user: current_user,
          content: "库存告警已解决: #{@stock_alert.part&.name}",
          metadata: { stock_alert_id: @stock_alert.id }
        )
        format.html { redirect_to @stock_alert, notice: '库存告警已标记为已解决。' }
        format.turbo_stream { redirect_to @stock_alert, notice: '库存告警已标记为已解决。' }
      else
        format.html { redirect_to @stock_alert, alert: @stock_alert.errors.full_messages.join(', ') }
        format.turbo_stream { render :show, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_stock_alert
    @stock_alert = StockAlert.find(params[:id])
  end
end
