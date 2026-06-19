class SecondaryConsumptionsController < ApplicationController
  def index
    @q = SecondaryConsumption.ransack(params[:q])
    @secondary_consumptions = @q.result
      .recent
      .includes(:merchant_contract)
      .page(params[:page])
      .per(30)
  end

  def show
    @secondary_consumption = SecondaryConsumption.find(params[:id])
  end
end
