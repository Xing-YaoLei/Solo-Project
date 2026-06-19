class ProcessingRecordsController < ApplicationController
  before_action :set_processing_record, only: [:show, :edit, :update, :destroy, :add_attachment, :remove_attachment]

  def index
    @q = ProcessingRecord.ransack(params[:q])
    @processing_records = @q.result.recent.page(params[:page]).per(20)
  end

  def show
  end

  def edit
  end

  def update
    if @processing_record.update(processing_record_params)
      redirect_to @processing_record, notice: "处理记录更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @processing_record.destroy
    redirect_to processing_records_url, notice: "处理记录已删除。", status: :see_other
  end

  def add_attachment
    if params[:attachments].present?
      params[:attachments].each do |attachment|
        @processing_record.attachments.attach(attachment)
      end
      redirect_to @processing_record, notice: "附件上传成功。"
    else
      redirect_to @processing_record, alert: "请选择要上传的文件。"
    end
  end

  def remove_attachment
    attachment = @processing_record.attachments.find(params[:attachment_id])
    attachment.purge
    redirect_to @processing_record, notice: "附件已删除。"
  end

  private

  def set_processing_record
    @processing_record = ProcessingRecord.find(params[:id])
  end

  def processing_record_params
    params.require(:processing_record).permit(:status, :action_type, :notes)
  end
end
