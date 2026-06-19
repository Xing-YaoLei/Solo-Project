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
    @processing_record.previous_status ||= @heat_point.status.to_s if @processing_record.next_status.present?

    if @processing_record.save
      @processing_record.apply_status_change!

      if params[:processing_record]&.[](:attachments).present?
        params[:processing_record][:attachments].each do |attachment|
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
    params.require(:processing_record).permit(:action_type, :status, :notes, :previous_status, :next_status, attachments: [])
  end
end
