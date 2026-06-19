class CheckInRecordsController < ApplicationController
  before_action :set_check_in_record, only: [:show, :edit, :update, :destroy]

  def index
    authorize CheckInRecord
    scope = policy_scope(CheckInRecord).order(actual_check_in_at: :desc)
    scope = scope.where(order_id: params[:order_id]) if params[:order_id].present?
    @check_in_records = scope.page(params[:page]).per(20)
  end

  def show
    authorize @check_in_record
  end

  def new
    @order = Order.find(params[:order_id]) if params[:order_id].present?
    @check_in_record = CheckInRecord.new
    @check_in_record.order = @order if @order.present?
    authorize @check_in_record
  end

  def create
    @check_in_record = CheckInRecord.new(check_in_record_params)
    @check_in_record.order = Order.find(params[:order_id]) if params[:order_id].present?
    @check_in_record.staff = current_user
    authorize @check_in_record

    if @check_in_record.save
      redirect_to @check_in_record.order, notice: "入住记录创建成功。"
    else
      @order = @check_in_record.order
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @check_in_record
  end

  def update
    authorize @check_in_record

    if @check_in_record.update(check_in_record_params)
      redirect_to @check_in_record, notice: "入住记录更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @check_in_record
    order = @check_in_record.order
    @check_in_record.destroy
    redirect_to order_path(order), notice: "入住记录已删除。"
  end

  private

  def set_check_in_record
    @check_in_record = CheckInRecord.find(params[:id])
  end

  def check_in_record_params
    params.require(:check_in_record).permit(:order_id, :actual_check_in_at, :actual_check_out_at,
                                             :guest_count, :id_card_number, :notes)
  end
end
