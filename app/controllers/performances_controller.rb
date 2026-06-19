class PerformancesController < ApplicationController
  before_action :set_performance, only: [:show, :edit, :update, :destroy]

  def index
    @q = Performance.ransack(params[:q])
    @performances = @q.result.order(start_time: :desc).page(params[:page]).per(20)
  end

  def show
    @performance_seats = @performance.performance_seats.page(params[:page]).per(50)
    @processing_records = @performance.processing_records.recent.page(params[:record_page]).per(10)
    @cancellation = @performance.performance_cancellation
  end

  def new
    @performance = Performance.new
  end

  def edit
  end

  def create
    @performance = Performance.new(performance_params)

    if @performance.save
      ProcessingRecord.create!(
        recordable: @performance,
        handler: current_user,
        action_type: "创建",
        status: :completed,
        notes: "创建演出"
      )
      redirect_to @performance, notice: "演出创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @performance.update(performance_params)
      ProcessingRecord.create!(
        recordable: @performance,
        handler: current_user,
        action_type: "更新",
        status: :completed,
        notes: "更新演出信息"
      )
      redirect_to @performance, notice: "演出更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @performance.destroy
    redirect_to performances_url, notice: "演出已删除。", status: :see_other
  end

  private

  def set_performance
    @performance = Performance.find(params[:id])
  end

  def performance_params
    params.require(:performance).permit(:name, :start_time, :end_time, :venue, :total_seats, :status, :description, :poster_image, :ticket_price)
  end
end
