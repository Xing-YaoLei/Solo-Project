class SettlementsController < ApplicationController
  before_action :set_settlement, only: [:show, :calculate, :approve, :reject, :export]

  def index
    @settlements = Settlement.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @settlement_items = @settlement.settlement_items.includes(:order, :enrollment, order: [:user, :course, :channel]).page(params[:page]).per(30)
  end

  def new
    @settlement = Settlement.new
  end

  def create
    @settlement = Settlement.new(settlement_params)
    if @settlement.save
      redirect_to @settlement, notice: "结算单已创建"
    else
      render :new
    end
  end

  def calculate
    @settlement.calculate_settlement!
    redirect_to @settlement, notice: "正在计算结算数据，请稍候刷新查看"
  end

  def approve
    @settlement.approve!
    redirect_to @settlement, notice: "结算已通过"
  end

  def reject
    @settlement.reject!
    redirect_to @settlement, notice: "结算已驳回"
  end

  def export
    send_data @settlement.to_excel,
              filename: "结算明细_#{@settlement.period_start}_#{@settlement.period_end}.xlsx",
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end

  private

  def set_settlement
    @settlement = Settlement.find(params[:id])
  end

  def settlement_params
    params.require(:settlement).permit(:period_start, :period_end)
  end
end
