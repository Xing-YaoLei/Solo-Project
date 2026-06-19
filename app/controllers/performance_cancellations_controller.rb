class PerformanceCancellationsController < ApplicationController
  before_action :set_cancellation, only: [:show, :take_over, :add_notes, :change_handler, :resolve]

  def index
    @q = PerformanceCancellation.ransack(params[:q])
    @cancellations = @q.result.recent.page(params[:page]).per(20)
  end

  def show
    @processing_records = @cancellation.processing_records.recent
  end

  def take_over
    if @cancellation.take_over(current_user, params[:notes])
      redirect_to @cancellation, notice: "已接手处理。"
    else
      redirect_to @cancellation, alert: "接手失败。"
    end
  end

  def add_notes
    if @cancellation.add_supplementary_notes(current_user, params[:notes])
      redirect_to @cancellation, notice: "补充说明已添加。"
    else
      redirect_to @cancellation, alert: "添加失败。"
    end
  end

  def change_handler
    new_handler = User.find(params[:new_handler_id])
    if @cancellation.change_handler(current_user, new_handler, params[:reason])
      redirect_to @cancellation, notice: "责任人已变更。"
    else
      redirect_to @cancellation, alert: "变更失败。"
    end
  end

  def resolve
    if @cancellation.resolve(current_user, params[:resolution_notes])
      redirect_to @cancellation, notice: "已解决。"
    else
      redirect_to @cancellation, alert: "解决失败。"
    end
  end

  private

  def set_cancellation
    @cancellation = PerformanceCancellation.find(params[:id])
  end
end
