class HeatPoints::ProcessingRecordsController < ApplicationController
  before_action :set_heat_point

  def index
    @processing_records = @heat_point.processing_records.recent.page(params[:page]).per(20)
  end

  def new
    @processing_record = @heat_point.processing_records.new
  end

  def create
    @processing_record = @heat_point.processing_records.new(processing_record_params)
    @processing_record.handler = current_user

    if @processing_record.save
      if params[:attachments].present?
        params[:attachments].each do |attachment|
          @processing_record.attachments.attach(attachment)
        end
      end
      redirect_to @heat_point, notice: "处理记录创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_heat_point
    @heat_point = HeatPoint.find(params[:heat_point_id])
  end

  def processing_record_params
    params.require(:processing_record).permit(:action_type, :status, :notes)
  end
end
