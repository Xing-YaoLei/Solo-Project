class QuotesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_quote, only: %i[show edit update destroy approve]

  def index
    @quotes = @work_order.quotes.includes(:created_by, :approved_by).order(created_at: :desc)
  end

  def show
    @quote_items = @quote.quote_items
  end

  def new
    @quote = @work_order.quotes.new
  end

  def create
    @quote = @work_order.quotes.build(quote_params)
    @quote.created_by = current_user

    respond_to do |format|
      if @quote.save
        @work_order.timeline_events.create!(
          event_type: :quote_created,
          user: current_user,
          content: "创建报价单: #{@quote.quote_no}",
          metadata: { quote_id: @quote.id, quote_no: @quote.quote_no }
        )
        format.html { redirect_to [@work_order, @quote], notice: '报价单已成功创建。' }
        format.turbo_stream { redirect_to [@work_order, @quote], notice: '报价单已成功创建。' }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit; end

  def update
    respond_to do |format|
      if @quote.update(quote_params)
        format.html { redirect_to [@work_order, @quote], notice: '报价单已成功更新。' }
        format.turbo_stream { redirect_to [@work_order, @quote], notice: '报价单已成功更新。' }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { render :edit, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @quote.destroy
    respond_to do |format|
      format.html { redirect_to work_order_quotes_url(@work_order), notice: '报价单已成功删除。' }
      format.turbo_stream { redirect_to work_order_quotes_url(@work_order), notice: '报价单已成功删除。' }
    end
  end

  def approve
    respond_to do |format|
      if @quote.update(status: :approved, approved_by: current_user, approved_at: Time.current)
        @work_order.timeline_events.create!(
          event_type: :quote_approved,
          user: current_user,
          content: "报价单 #{@quote.quote_no} 已批准",
          metadata: { quote_id: @quote.id, quote_no: @quote.quote_no }
        )
        format.html { redirect_to [@work_order, @quote], notice: '报价单已成功批准。' }
        format.turbo_stream { redirect_to [@work_order, @quote], notice: '报价单已成功批准。' }
      else
        format.html { redirect_to [@work_order, @quote], alert: @quote.errors.full_messages.join(', ') }
        format.turbo_stream { render :show, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_quote
    @quote = @work_order.quotes.find(params[:id])
  end

  def quote_params
    params.require(:quote).permit(
      :quote_no,
      :status,
      :total_amount,
      :valid_until,
      :customer_approved,
      quote_items_attributes: %i[id name description item_type quantity unit_price discount_rate _destroy]
    )
  end
end
