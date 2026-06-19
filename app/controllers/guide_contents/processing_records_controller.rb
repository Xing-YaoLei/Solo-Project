class GuideContents::ProcessingRecordsController < ApplicationController
  before_action :set_guide_content

  def index
    @processing_records = @guide_content.processing_records.recent.page(params[:page]).per(20)
  end

  def new
    @processing_record = @guide_content.processing_records.new
  end

  def create
    @processing_record = @guide_content.processing_records.new(processing_record_params)
    @processing_record.handler = current_user

    if @processing_record.save
      redirect_to @guide_content, notice: "处理记录创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_guide_content
    @guide_content = GuideContent.find(params[:guide_content_id])
  end

  def processing_record_params
    params.require(:processing_record).permit(:action_type, :status, :notes)
  end
end
