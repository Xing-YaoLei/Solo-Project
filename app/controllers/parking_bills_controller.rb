class ParkingBillsController < ApplicationController
  before_action :set_parking_bill, only: %i[show edit update destroy pay]

  def index
    @parking_bills = ParkingBill.includes(:parking_spot).order(created_at: :desc)
    @parking_bills = @parking_bills.where(status: params[:status]) if params[:status].present?
    @parking_bills = @parking_bills.where(bill_type: params[:bill_type]) if params[:bill_type].present?
    @parking_bills = @parking_bills.where(plate_number: params[:plate_number]) if params[:plate_number].present?
  end

  def show
  end

  def new
    @parking_bill = ParkingBill.new
  end

  def create
    @parking_bill = ParkingBill.new(parking_bill_params)
    if @parking_bill.save
      redirect_to @parking_bill, notice: "账单创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @parking_bill.update(parking_bill_params)
      redirect_to @parking_bill, notice: "账单更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def pay
    if @parking_bill.update(status: :paid, paid_at: Time.current, payment_method: params[:payment_method])
      redirect_to @parking_bill, notice: "缴费成功"
    else
      redirect_to @parking_bill, alert: "缴费失败"
    end
  end

  def destroy
    @parking_bill.destroy!
    redirect_to parking_bills_url, notice: "账单已删除"
  end

  private

  def set_parking_bill
    @parking_bill = ParkingBill.find(params[:id])
  end

  def parking_bill_params
    params.require(:parking_bill).permit(
      :parking_spot_id, :access_record_id, :plate_number,
      :bill_type, :amount, :check_in_at, :check_out_at, :payment_method
    )
  end
end
