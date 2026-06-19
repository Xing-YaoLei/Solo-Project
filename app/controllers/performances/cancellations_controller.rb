class Performances::CancellationsController < ApplicationController
  before_action :set_performance

  def show
    @cancellation = @performance.performance_cancellation
  end

  def new
    @cancellation = @performance.build_performance_cancellation
  end

  def create
    @cancellation = @performance.build_performance_cancellation(cancellation_params)

    if @cancellation.save
      @performance.cancelled!

      ProcessingRecord.create!(
        recordable: @cancellation,
        handler: current_user,
        action_type: "上报取消",
        status: :reported,
        notes: @cancellation.reason
      )

      redirect_to performance_cancellation_path(@cancellation), notice: "演出取消已上报。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_performance
    @performance = Performance.find(params[:performance_id])
  end

  def cancellation_params
    params.require(:performance_cancellation).permit(:reason, :affected_audience_count, :affected_merchant_count)
  end
end
