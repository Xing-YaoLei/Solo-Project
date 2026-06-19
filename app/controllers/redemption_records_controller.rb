class RedemptionRecordsController < ApplicationController
  before_action :set_redemption_record, only: [:show, :edit, :update, :destroy, :redeem]

  def index
    authorize RedemptionRecord
    scope = RedemptionRecord.all.order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(order_id: params[:order_id]) if params[:order_id].present?
    @redemption_records = scope.page(params[:page]).per(20)
  end

  def show
    authorize @redemption_record
  end

  def new
    @redemption_record = RedemptionRecord.new
    @redemption_record.order = Order.find(params[:order_id]) if params[:order_id].present?
    authorize @redemption_record
  end

  def create
    @redemption_record = RedemptionRecord.new(redemption_record_params)
    authorize @redemption_record

    if @redemption_record.save
      redirect_to @redemption_record.order, notice: "核销记录创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @redemption_record
  end

  def update
    authorize @redemption_record

    if @redemption_record.update(redemption_record_params)
      redirect_to @redemption_record, notice: "核销记录更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @redemption_record
    order = @redemption_record.order
    @redemption_record.destroy
    redirect_to order_path(order), notice: "核销记录已删除。"
  end

  def redeem
    authorize @redemption_record

    if @redemption_record.redeem!(current_user)
      redirect_to @redemption_record.order, notice: "核销成功。"
    else
      redirect_to @redemption_record.order, alert: "核销失败。"
    end
  end

  private

  def set_redemption_record
    @redemption_record = RedemptionRecord.find(params[:id])
  end

  def redemption_record_params
    params.require(:redemption_record).permit(:order_id, :redemption_code, :status, :notes)
  end
end
